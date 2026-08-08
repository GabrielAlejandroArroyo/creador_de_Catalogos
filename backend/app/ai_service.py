"""Cliente HTTP para APIs compatibles con OpenAI Chat Completions."""
from __future__ import annotations

from typing import Optional

import httpx

from app.ai_defaults import effective_api_key
from app.ai_rag import retrieve_context
from app.models import AiConnection

SYSTEM_PROMPT = """Sos el asistente de ayuda del sistema "Creador de Catálogos".
Explicás conceptos y flujos de la app en español, claro y concreto (APB).
Conceptos clave: Plataforma, Objeto, Cambio, Complejidad Objeto, Complejidad Cambio,
Catálogo, Item, código (concatenación de siglas), Time, baja lógica/definitiva, exportación.
No inventes funciones que el sistema no tenga. Si no sabés, decilo.
No pedís datos sensibles ni claves de API."""


def _chat_url(base_url: str) -> str:
    base = base_url.rstrip("/")
    if base.endswith("/chat/completions"):
        return base
    if base.endswith("/v1"):
        return f"{base}/chat/completions"
    return f"{base}/v1/chat/completions"


async def call_chat_completion(
    connection: AiConnection,
    user_message: str,
    *,
    concept: Optional[str] = None,
    include_rag: bool = False,
) -> tuple[str, list[str]]:
    sources: list[str] = []
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    if include_rag or connection.mode == "foundational_rag":
        context, sources = retrieve_context(user_message, concept=concept)
        if context:
            messages.append({
                "role": "system",
                "content": (
                    "Usá el siguiente contexto interno de la app para responder. "
                    "Si el contexto no alcanza, decilo.\n\n" + context
                ),
            })

    if concept:
        messages.append({
            "role": "user",
            "content": f"Concepto: {concept}\n\nPregunta: {user_message}",
        })
    else:
        messages.append({"role": "user", "content": user_message})

    api_key = effective_api_key(connection.api_key, connection.base_url)
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    payload = {
        "model": connection.model_name,
        "messages": messages,
        "temperature": 0.3,
    }

    # Modelos locales reasoning pueden tardar más.
    timeout = 180.0 if "127.0.0.1" in (connection.base_url or "") or "localhost" in (connection.base_url or "") else 60.0

    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.post(_chat_url(connection.base_url), headers=headers, json=payload)
        if response.status_code >= 400:
            detail = response.text[:500]
            raise RuntimeError(f"Error del proveedor IA ({response.status_code}): {detail}")
        data = response.json()

    try:
        reply = data["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError, TypeError, AttributeError) as exc:
        raise RuntimeError("Respuesta inesperada del proveedor IA") from exc
    return reply, sources


async def test_connection(connection: AiConnection) -> tuple[bool, str]:
    try:
        reply, _ = await call_chat_completion(
            connection,
            "Respondé solo con la palabra OK.",
            include_rag=False,
        )
        return True, f"Conexión OK. Respuesta: {reply[:120]}"
    except Exception as exc:  # noqa: BLE001
        return False, str(exc)
