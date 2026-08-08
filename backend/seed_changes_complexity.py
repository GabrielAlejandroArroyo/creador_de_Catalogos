"""Inicializa Cambios, Complejidad Objeto y Complejidad Cambio."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.database import SessionLocal, engine, Base
from app.models import Change, ComplexityObject, ComplexityChange

CHANGES = [
    {"description": "Cambio", "initial": "C"},
    {"description": "Nuevo", "initial": "N"},
]

COMPLEXITY_OBJECTS = [
    {"description": "Alta", "initial": "A"},
    {"description": "Baja", "initial": "B"},
    {"description": "Media", "initial": "M"},
    {"description": "Muy alta", "initial": "X"},
    {"description": "Muy Baja", "initial": "Y"},
    {"description": "Extrema", "initial": "E"},
]

COMPLEXITY_CHANGES = [
    {"description": "Alta", "initial": "A"},
    {"description": "Baja", "initial": "B"},
    {"description": "Media", "initial": "M"},
    {"description": "Muy alta", "initial": "X"},
    {"description": "Muy Baja", "initial": "Y"},
    {"description": "No Aplica", "initial": "N"},
]


def _seed_simple(db, model, items, label):
    created = 0
    skipped = 0
    print(f"Inicializando {label}...\n")
    for item in items:
        exists = db.query(model).filter(model.initial == item["initial"]).first()
        if exists:
            skipped += 1
            print(f"  [omitido] {item['description']} ({item['initial']}) - ya existe")
            continue
        db.add(model(description=item["description"], initial=item["initial"]))
        created += 1
        print(f"  [creado]  {item['description']} ({item['initial']})")
    print(f"\n{label}: {created} creados, {skipped} omitidos.\n")
    return created, skipped


def seed_changes_complexity():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        _seed_simple(db, Change, CHANGES, "Cambios")
        _seed_simple(db, ComplexityObject, COMPLEXITY_OBJECTS, "Complejidad Objeto")
        _seed_simple(db, ComplexityChange, COMPLEXITY_CHANGES, "Complejidad Cambio")
        db.commit()
        print("Listo.")
    except Exception as exc:
        db.rollback()
        print(f"Error: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_changes_complexity()
