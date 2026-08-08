from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.ai_defaults import (
    DEFAULT_OPEN_MODEL,
    FREE_CONNECTION_NAME,
    OLLAMA_BASE_URL,
    allows_empty_api_key,
    build_rag_only_reply,
    effective_api_key,
    make_free_preset_payload,
    resolve_free_open_source,
)
from app.ai_service import call_chat_completion, test_connection
from app.database import get_db
from app.models import AiConnection
from app.schemas import (
    AiChatRequest,
    AiChatResponse,
    AiConnectionCreate,
    AiConnectionResponse,
    AiConnectionUpdate,
    AiStatusResponse,
    AiTestResponse,
)

router = APIRouter(prefix="/api/ai", tags=["Asistente IA"])

VALID_MODES = {"foundational", "foundational_rag"}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _mask_key(api_key: str) -> str:
    if not api_key:
        return "(sin key / gratis)"
    if len(api_key) <= 8:
        return "*" * len(api_key)
    return f"{api_key[:4]}…{api_key[-4:]}"


def _to_response(record: AiConnection) -> AiConnectionResponse:
    return AiConnectionResponse(
        id=record.id,
        name=record.name,
        base_url=record.base_url,
        api_key_masked=_mask_key(record.api_key or ""),
        model_name=record.model_name,
        mode=record.mode,
        is_active=record.is_active,
        is_enabled=record.is_enabled,
        updated_at=record.updated_at,
    )


def _is_usable(record: AiConnection) -> bool:
    if not record.is_enabled or not (record.model_name and record.model_name.strip()):
        return False
    key = (record.api_key or "").strip()
    if key:
        return True
    # Sin API key: solo si es endpoint local/gratis (Ollama)
    return allows_empty_api_key(record.base_url or "")


def _validate_mode(mode: str) -> None:
    if mode not in VALID_MODES:
        raise HTTPException(
            status_code=400,
            detail="mode debe ser 'foundational' o 'foundational_rag'",
        )


def _deactivate_all(db: Session) -> None:
    db.query(AiConnection).update({AiConnection.is_active: False})


def _ensure_one_active(db: Session, preferred: Optional[AiConnection] = None) -> Optional[AiConnection]:
    candidates = (
        db.query(AiConnection)
        .filter(AiConnection.is_enabled.is_(True))
        .order_by(AiConnection.id.asc())
        .all()
    )
    usable = [c for c in candidates if _is_usable(c)]
    if not usable:
        _deactivate_all(db)
        db.commit()
        return None

    active = next((c for c in usable if c.is_active), None)
    if preferred and preferred.id in {c.id for c in usable}:
        preferred = next(c for c in usable if c.id == preferred.id)
        _deactivate_all(db)
        preferred.is_active = True
        db.commit()
        db.refresh(preferred)
        return preferred
    if active:
        return active

    _deactivate_all(db)
    usable[0].is_active = True
    db.commit()
    db.refresh(usable[0])
    return usable[0]


def _get_or_404(db: Session, connection_id: int) -> AiConnection:
    record = db.query(AiConnection).filter(AiConnection.id == connection_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Conexión IA no encontrada")
    return record


def _has_paid_style_key(record: AiConnection) -> bool:
    key = (record.api_key or "").strip()
    if not key or key.lower() == "ollama":
        return False
    return not allows_empty_api_key(record.base_url or "") or bool(key)


@router.get("/status", response_model=AiStatusResponse)
async def ai_status(db: Session = Depends(get_db)):
    all_rows = db.query(AiConnection).all()
    usable = [c for c in all_rows if _is_usable(c)]
    active = next((c for c in usable if c.is_active), None)
    if usable and not active:
        active = _ensure_one_active(db)

    if active:
        using_free = not _has_paid_style_key(active)
        return AiStatusResponse(
            configured=True,
            active_connection_id=active.id,
            active_connection_name=active.name,
            mode=active.mode,
            model_name=active.model_name,
            connections_count=len(all_rows),
            provider_kind="custom" if not using_free else "ollama_free",
            using_free_opensource=using_free,
            requires_api_key=False,
        )

    free_conn, kind = await resolve_free_open_source()
    if free_conn:
        return AiStatusResponse(
            configured=True,
            active_connection_id=None,
            active_connection_name=free_conn.name,
            mode=free_conn.mode,
            model_name=free_conn.model_name,
            connections_count=len(all_rows),
            provider_kind=kind,
            using_free_opensource=True,
            requires_api_key=False,
        )

    return AiStatusResponse(
        configured=True,
        active_connection_id=None,
        active_connection_name="Ayuda local (RAG sin LLM)",
        mode="foundational_rag",
        model_name="rag-offline",
        connections_count=len(all_rows),
        provider_kind="rag_offline",
        using_free_opensource=True,
        requires_api_key=False,
    )


@router.get("/connections", response_model=List[AiConnectionResponse])
def list_connections(db: Session = Depends(get_db)):
    rows = db.query(AiConnection).order_by(AiConnection.id.asc()).all()
    return [_to_response(r) for r in rows]


@router.get("/free-preset")
def free_preset():
    return make_free_preset_payload()


@router.post("/connections", response_model=AiConnectionResponse, status_code=201)
def create_connection(data: AiConnectionCreate, db: Session = Depends(get_db)):
    _validate_mode(data.mode)
    if not data.name.strip() or not data.model_name.strip():
        raise HTTPException(status_code=400, detail="name y model_name son requeridos")

    base_url = (data.base_url or OLLAMA_BASE_URL).strip()
    api_key = (data.api_key or "").strip()
    if not api_key and not allows_empty_api_key(base_url):
        raise HTTPException(
            status_code=400,
            detail=(
                "api_key es requerida para proveedores cloud. "
                f"Sin key usá Ollama local ({OLLAMA_BASE_URL}) o el preset gratis."
            ),
        )

    record = AiConnection(
        name=data.name.strip(),
        base_url=base_url,
        api_key=api_key,
        model_name=data.model_name.strip(),
        mode=data.mode,
        is_enabled=data.is_enabled,
        is_active=False,
        updated_at=_now_iso(),
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    should_activate = data.activate or not any(
        c.is_active and _is_usable(c) for c in db.query(AiConnection).all() if c.id != record.id
    )
    if should_activate and _is_usable(record):
        _ensure_one_active(db, preferred=record)
        db.refresh(record)
    else:
        _ensure_one_active(db)

    return _to_response(record)


@router.post("/connections/use-free-opensource", response_model=AiConnectionResponse, status_code=201)
async def use_free_opensource(db: Session = Depends(get_db)):
    """Alta/activa conexión Ollama gratis (DeepSeek-R1 u otro modelo open instalado)."""
    free_conn, kind = await resolve_free_open_source()
    model_name = free_conn.model_name if free_conn else DEFAULT_OPEN_MODEL

    existing = (
        db.query(AiConnection)
        .filter(AiConnection.name == FREE_CONNECTION_NAME)
        .first()
    )
    if existing:
        existing.base_url = OLLAMA_BASE_URL
        existing.api_key = ""
        existing.model_name = model_name
        existing.mode = "foundational_rag"
        existing.is_enabled = True
        existing.updated_at = _now_iso()
        db.commit()
        db.refresh(existing)
        _ensure_one_active(db, preferred=existing)
        db.refresh(existing)
        return _to_response(existing)

    record = AiConnection(
        name=FREE_CONNECTION_NAME,
        base_url=OLLAMA_BASE_URL,
        api_key="",
        model_name=model_name,
        mode="foundational_rag",
        is_enabled=True,
        is_active=False,
        updated_at=_now_iso(),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    _ensure_one_active(db, preferred=record)
    db.refresh(record)
    if kind == "rag_offline":
        # Igual se guarda el preset; el chat caerá a RAG si Ollama no está.
        pass
    return _to_response(record)


@router.put("/connections/{connection_id}", response_model=AiConnectionResponse)
def update_connection(connection_id: int, data: AiConnectionUpdate, db: Session = Depends(get_db)):
    record = _get_or_404(db, connection_id)
    if data.mode is not None:
        _validate_mode(data.mode)
        record.mode = data.mode
    if data.name is not None:
        record.name = data.name.strip()
    if data.base_url is not None:
        record.base_url = data.base_url.strip()
    if data.api_key is not None:
        # vacío explícito = borrar key (modo gratis/local)
        record.api_key = data.api_key.strip()
    if data.model_name is not None:
        record.model_name = data.model_name.strip()
    if data.is_enabled is not None:
        record.is_enabled = data.is_enabled

    if not _is_usable(record) and record.is_enabled:
        # si quedó cloud sin key, avisar
        if not allows_empty_api_key(record.base_url or "") and not (record.api_key or "").strip():
            raise HTTPException(
                status_code=400,
                detail="Sin API key solo se permiten endpoints locales (Ollama).",
            )

    record.updated_at = _now_iso()
    db.commit()
    db.refresh(record)
    _ensure_one_active(db)
    db.refresh(record)
    return _to_response(record)


@router.post("/connections/{connection_id}/activate", response_model=AiConnectionResponse)
def activate_connection(connection_id: int, db: Session = Depends(get_db)):
    record = _get_or_404(db, connection_id)
    if not _is_usable(record):
        raise HTTPException(
            status_code=400,
            detail="La conexión debe estar habilitada y tener modelo (API key solo si no es local/gratis)",
        )
    activated = _ensure_one_active(db, preferred=record)
    return _to_response(activated or record)


@router.delete("/connections/{connection_id}", status_code=204)
def delete_connection(connection_id: int, db: Session = Depends(get_db)):
    record = _get_or_404(db, connection_id)
    db.delete(record)
    db.commit()
    _ensure_one_active(db)
    return None


@router.post("/connections/{connection_id}/test", response_model=AiTestResponse)
async def test_ai_connection(connection_id: int, db: Session = Depends(get_db)):
    record = _get_or_404(db, connection_id)
    if not record.model_name:
        raise HTTPException(status_code=400, detail="Falta model_name")
    if not effective_api_key(record.api_key, record.base_url) and not allows_empty_api_key(record.base_url):
        raise HTTPException(status_code=400, detail="Falta api_key para este proveedor")
    ok, detail = await test_connection(record)
    return AiTestResponse(ok=ok, detail=detail)


@router.post("/chat", response_model=AiChatResponse)
async def ai_chat(data: AiChatRequest, db: Session = Depends(get_db)):
    if not data.message or not data.message.strip():
        raise HTTPException(status_code=400, detail="message es requerido")

    active = (
        db.query(AiConnection)
        .filter(AiConnection.is_active.is_(True))
        .first()
    )
    if not active or not _is_usable(active):
        active = _ensure_one_active(db)

    message = data.message.strip()

    if active:
        try:
            reply, sources = await call_chat_completion(
                active,
                message,
                concept=data.concept,
                include_rag=active.mode == "foundational_rag",
            )
            return AiChatResponse(
                reply=reply,
                mode=active.mode,
                connection_name=active.name,
                model_name=active.model_name,
                sources=sources,
                provider_kind="custom" if _has_paid_style_key(active) else "ollama_free",
            )
        except Exception as exc:  # noqa: BLE001
            # Si falló la activa sin key / local, intentar fallback gratis
            if _has_paid_style_key(active):
                raise HTTPException(status_code=502, detail=str(exc)) from exc

    free_conn, kind = await resolve_free_open_source()
    if free_conn:
        try:
            reply, sources = await call_chat_completion(
                free_conn,
                message,
                concept=data.concept,
                include_rag=True,
            )
            return AiChatResponse(
                reply=reply,
                mode=free_conn.mode,
                connection_name=free_conn.name,
                model_name=free_conn.model_name,
                sources=sources,
                provider_kind="ollama_free",
            )
        except Exception as exc:  # noqa: BLE001
            # Caer a RAG offline con tip del error
            reply, sources = build_rag_only_reply(message, concept=data.concept)
            tip = (
                f"\n\n(Nota: Ollama no respondió: {str(exc)[:200]}. "
                f"Probá `ollama pull {DEFAULT_OPEN_MODEL}`.)"
            )
            return AiChatResponse(
                reply=reply + tip,
                mode="foundational_rag",
                connection_name="Ayuda local (RAG sin LLM)",
                model_name="rag-offline",
                sources=sources,
                provider_kind="rag_offline",
            )

    reply, sources = build_rag_only_reply(message, concept=data.concept)
    return AiChatResponse(
        reply=reply,
        mode="foundational_rag",
        connection_name="Ayuda local (RAG sin LLM)",
        model_name="rag-offline",
        sources=sources,
        provider_kind=kind,
    )
