"""Fallback gratis / open source sin API key de pago."""
from __future__ import annotations

from typing import List, Optional, Tuple
from urllib.parse import urlparse

import httpx

from app.ai_rag import retrieve_context
from app.models import AiConnection

# Ollama local: sin API key de pago. DeepSeek-R1 = reasoning open source actual vía Ollama.
OLLAMA_BASE_URL = "http://127.0.0.1:11434/v1"
OLLAMA_TAGS_URL = "http://127.0.0.1:11434/api/tags"
FREE_CONNECTION_NAME = "Ollama local (gratis / open source)"
# Preferencia: modelos “pensantes” / reasoning open source, luego generales.
PREFERRED_OPEN_MODELS: List[str] = [
    "deepseek-r1",
    "deepseek-r1:latest",
    "deepseek-r1:14b",
    "deepseek-r1:8b",
    "qwq",
    "qwq:latest",
    "qwen3",
    "qwen3:latest",
    "qwen2.5",
    "qwen2.5:latest",
    "llama3.3",
    "llama3.3:latest",
    "llama3.2",
    "llama3.2:latest",
    "mistral",
    "mistral:latest",
    "phi4",
    "phi4:latest",
]
DEFAULT_OPEN_MODEL = "deepseek-r1"


def is_local_or_free_url(base_url: str) -> bool:
    if not base_url:
        return False
    host = (urlparse(base_url).hostname or "").lower()
    return host in {"127.0.0.1", "localhost", "::1"} or "ollama" in host


def effective_api_key(api_key: Optional[str], base_url: str) -> str:
    """Ollama y locales aceptan cualquier bearer; sin key usamos placeholder gratis."""
    if api_key and api_key.strip():
        return api_key.strip()
    if is_local_or_free_url(base_url):
        return "ollama"
    return ""


def allows_empty_api_key(base_url: str) -> bool:
    return is_local_or_free_url(base_url)


async def list_ollama_models() -> List[str]:
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            response = await client.get(OLLAMA_TAGS_URL)
            if response.status_code >= 400:
                return []
            data = response.json()
            models = data.get("models") or []
            names: List[str] = []
            for m in models:
                name = (m.get("name") or m.get("model") or "").strip()
                if name:
                    names.append(name)
            return names
    except Exception:  # noqa: BLE001
        return []


def pick_best_open_model(installed: List[str]) -> str:
    if not installed:
        return DEFAULT_OPEN_MODEL
    lower_map = {n.lower(): n for n in installed}
    for pref in PREFERRED_OPEN_MODELS:
        if pref.lower() in lower_map:
            return lower_map[pref.lower()]
        # match por prefijo (deepseek-r1:32b, etc.)
        for installed_name in installed:
            if installed_name.lower().startswith(pref.lower().split(":")[0]):
                return installed_name
    return installed[0]


async def resolve_free_open_source() -> Tuple[Optional[AiConnection], str]:
    """
    Resuelve conexión gratis.
    Retorna (connection|None, provider_kind) donde provider_kind es
    ollama_free | rag_offline.
    """
    installed = await list_ollama_models()
    if installed:
        model = pick_best_open_model(installed)
        conn = AiConnection(
            id=0,
            name=FREE_CONNECTION_NAME,
            base_url=OLLAMA_BASE_URL,
            api_key="ollama",
            model_name=model,
            mode="foundational_rag",
            is_active=True,
            is_enabled=True,
            updated_at=None,
        )
        return conn, "ollama_free"

    # Sin Ollama: el chat usará solo RAG local (sin LLM externo).
    return None, "rag_offline"


def build_rag_only_reply(message: str, concept: Optional[str] = None) -> Tuple[str, List[str]]:
    context, sources = retrieve_context(message, concept=concept, top_k=4)
    if not context:
        text = (
            "No hay API key configurada y tampoco encontré Ollama local ni contexto en la "
            "base de ayuda. Instalá Ollama (https://ollama.com), ejecutá "
            f"`ollama pull {DEFAULT_OPEN_MODEL}` y reiniciá, o cargá una API key gratis/propia "
            "en Mantenimiento IA."
        )
        return text, []

    header = (
        "Respondiendo con la base de conocimiento local (gratis, sin API key). "
        f"Para un modelo open source “pensante”, instalá Ollama y `ollama pull {DEFAULT_OPEN_MODEL}`.\n\n"
    )
    return header + context, sources


def make_free_preset_payload() -> dict:
    return {
        "name": FREE_CONNECTION_NAME,
        "base_url": OLLAMA_BASE_URL,
        "api_key": "",
        "model_name": DEFAULT_OPEN_MODEL,
        "mode": "foundational_rag",
        "is_enabled": True,
        "activate": True,
    }
