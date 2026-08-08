"""Exporta catalog.db a frontend/src/assets/demo/db.json para GitHub Pages."""
from __future__ import annotations

import json
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB_PATH = Path(__file__).resolve().parent / "catalog.db"
OUT_PATH = ROOT / "frontend" / "src" / "assets" / "demo" / "db.json"


def rows(conn: sqlite3.Connection, sql: str) -> list[dict]:
    conn.row_factory = sqlite3.Row
    return [dict(r) for r in conn.execute(sql).fetchall()]


def main() -> None:
    if not DB_PATH.exists():
        raise SystemExit(f"No existe {DB_PATH}")

    conn = sqlite3.connect(DB_PATH)
    platforms = rows(conn, "SELECT id, description, initial FROM platforms ORDER BY id")
    objects_raw = rows(conn, "SELECT id, description, initial FROM objects ORDER BY id")
    links = rows(conn, "SELECT object_id, platform_id FROM object_platforms")
    by_object: dict[int, list[int]] = {}
    for link in links:
        by_object.setdefault(int(link["object_id"]), []).append(int(link["platform_id"]))

    objects = [
        {
            **obj,
            "platform_ids": sorted(by_object.get(int(obj["id"]), [])),
        }
        for obj in objects_raw
    ]

    payload = {
        "platforms": platforms,
        "objects": objects,
        "changes": rows(conn, "SELECT id, description, initial FROM changes ORDER BY id"),
        "complexity_objects": rows(
            conn, "SELECT id, description, initial FROM complexity_objects ORDER BY id"
        ),
        "complexity_changes": rows(
            conn, "SELECT id, description, initial FROM complexity_changes ORDER BY id"
        ),
        "catalogs": rows(conn, "SELECT id, description, initial FROM catalogs ORDER BY id"),
        "catalog_items": rows(
            conn,
            """
            SELECT id, catalog_id, platform_id, object_id, change_id,
                   complexity_object_id, complexity_change_id, code, time, baja_logica
            FROM catalog_items
            ORDER BY id
            """,
        ),
        "ai_connections": [],
    }
    conn.close()

    # SQLite bools may come as 0/1
    for item in payload["catalog_items"]:
        item["baja_logica"] = bool(item["baja_logica"])

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    print(
        f"OK -> {OUT_PATH} "
        f"({len(payload['catalogs'])} catalogs, {len(payload['catalog_items'])} items)"
    )


if __name__ == "__main__":
    main()
