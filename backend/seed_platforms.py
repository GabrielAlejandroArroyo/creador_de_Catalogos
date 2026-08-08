"""Inicializa el maestro de Plataformas con datos base."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.database import SessionLocal, engine, Base
from app.models import Platform

PLATFORMS = [
    {"description": "SQR", "initial": "Q"},
    {"description": "SYBASE", "initial": "Y"},
    {"description": "COBIS .NET", "initial": "O"},
    {"description": "VISUAL BASIC", "initial": "V"},
    {"description": "ASP", "initial": "A"},
    {"description": "NET", "initial": "N"},
    {"description": "C UNIX", "initial": "C"},
    {"description": "JAVA", "initial": "J"},
    {"description": "PERSO", "initial": "P"},
]


def seed_platforms():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    created = 0
    skipped = 0
    try:
        for item in PLATFORMS:
            exists = db.query(Platform).filter(Platform.initial == item["initial"]).first()
            if exists:
                skipped += 1
                print(f"  [omitido] {item['description']} ({item['initial']}) - ya existe")
                continue
            db.add(Platform(description=item["description"], initial=item["initial"]))
            created += 1
            print(f"  [creado]  {item['description']} ({item['initial']})")
        db.commit()
        print(f"\nListo: {created} creadas, {skipped} omitidas.")
    except Exception as exc:
        db.rollback()
        print(f"Error: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("Inicializando Plataformas...\n")
    seed_platforms()
