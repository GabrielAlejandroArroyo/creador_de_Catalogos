from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.database import engine, Base
from app.routers import (
    platforms, objects, changes,
    complexity_objects, complexity_changes,
    catalogs, catalog_items,
)


def migrate_objects_initial_unique():
    """Quita UNIQUE de objects.initial si existe (unicidad pasa a ser por sigla+plataforma)."""
    with engine.begin() as conn:
        row = conn.execute(
            text("SELECT sql FROM sqlite_master WHERE type='table' AND name='objects'")
        ).fetchone()
        if not row or not row[0]:
            return
        table_sql = row[0].upper()
        has_initial_unique = (
            "INITIAL VARCHAR NOT NULL UNIQUE" in table_sql
            or "UNIQUE (INITIAL)" in table_sql
            or "UNIQUE(INITIAL)" in table_sql
        )
        if not has_initial_unique:
            return
        conn.execute(text(
            """
            CREATE TABLE IF NOT EXISTS objects_new (
                id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                description VARCHAR NOT NULL,
                initial VARCHAR NOT NULL
            )
            """
        ))
        conn.execute(text(
            "INSERT INTO objects_new (id, description, initial) "
            "SELECT id, description, initial FROM objects"
        ))
        conn.execute(text("DROP TABLE objects"))
        conn.execute(text("ALTER TABLE objects_new RENAME TO objects"))


def migrate_catalog_items():
    """Agrega columna time y quita guiones de códigos existentes."""
    with engine.begin() as conn:
        row = conn.execute(
            text("SELECT name FROM sqlite_master WHERE type='table' AND name='catalog_items'")
        ).fetchone()
        if not row:
            return
        cols = conn.execute(text("PRAGMA table_info(catalog_items)")).fetchall()
        col_names = {c[1] for c in cols}
        if "time" not in col_names:
            conn.execute(text("ALTER TABLE catalog_items ADD COLUMN time FLOAT DEFAULT 0"))
        if "baja_logica" not in col_names:
            conn.execute(text("ALTER TABLE catalog_items ADD COLUMN baja_logica BOOLEAN DEFAULT 0"))
        conn.execute(text("UPDATE catalog_items SET time = 0 WHERE time IS NULL"))
        conn.execute(text("UPDATE catalog_items SET baja_logica = 0 WHERE baja_logica IS NULL"))
        conn.execute(text("UPDATE catalog_items SET code = REPLACE(code, '-', '') WHERE code LIKE '%-%'"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    migrate_objects_initial_unique()
    migrate_catalog_items()
    yield


app = FastAPI(
    title="Sistema de Catálogos",
    description="API para gestión de maestros y creación de items de catálogo",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(platforms.router)
app.include_router(objects.router)
app.include_router(changes.router)
app.include_router(complexity_objects.router)
app.include_router(complexity_changes.router)
app.include_router(catalogs.router)
app.include_router(catalog_items.router)


@app.get("/")
def root():
    return {"message": "Sistema de Catálogos API", "docs": "/docs"}
