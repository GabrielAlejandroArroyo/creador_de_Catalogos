"""RAG liviano: retrieval por score de tokens sobre markdowns locales."""
from __future__ import annotations

import re
from pathlib import Path
from typing import List, Optional, Tuple

KNOWLEDGE_DIR = Path(__file__).resolve().parent / "ai_knowledge"


def _tokenize(text: str) -> set[str]:
    return {t for t in re.findall(r"[a-záéíóúñü0-9]+", text.lower()) if len(t) > 2}


def _load_chunks() -> List[Tuple[str, str, str]]:
    """Retorna lista de (source, title, body)."""
    chunks: List[Tuple[str, str, str]] = []
    if not KNOWLEDGE_DIR.exists():
        return chunks
    for path in sorted(KNOWLEDGE_DIR.glob("*.md")):
        raw = path.read_text(encoding="utf-8")
        title = path.stem.replace("_", " ").title()
        for part in re.split(r"\n(?=#{1,3}\s)", raw):
            body = part.strip()
            if not body:
                continue
            heading = body.split("\n", 1)[0].lstrip("# ").strip() or title
            chunks.append((path.name, heading, body))
    return chunks


def retrieve_context(query: str, concept: Optional[str] = None, top_k: int = 4) -> tuple[str, list[str]]:
    chunks = _load_chunks()
    if not chunks:
        return "", []

    query_tokens = _tokenize(f"{query} {concept or ''}")
    if concept:
        concept_key = concept.lower().replace(" ", "_")
        preferred = [c for c in chunks if concept_key in c[0].lower() or concept.lower() in c[1].lower()]
        if preferred:
            chunks = preferred + [c for c in chunks if c not in preferred]

    scored: List[Tuple[float, Tuple[str, str, str]]] = []
    for chunk in chunks:
        tokens = _tokenize(f"{chunk[1]} {chunk[2]}")
        overlap = len(query_tokens & tokens)
        boost = 2.0 if concept and concept.lower() in chunk[1].lower() else 0.0
        score = overlap + boost
        if score > 0:
            scored.append((score, chunk))

    scored.sort(key=lambda x: x[0], reverse=True)
    selected = [c for _, c in scored[:top_k]]
    if not selected and concept:
        selected = chunks[: min(top_k, len(chunks))]

    sources = list(dict.fromkeys(c[0] for c in selected))
    blocks = [f"### {c[1]}\n{c[2]}" for c in selected]
    return "\n\n".join(blocks), sources
