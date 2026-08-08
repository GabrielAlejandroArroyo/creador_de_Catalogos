"""Inicializa el maestro de Objetos (unicidad: sigla objeto + sigla plataforma)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.database import SessionLocal, engine, Base
from app.models import Platform, ObjectMaster, ObjectPlatform
from seed_platforms import seed_platforms

# Cada fila es un Objeto. platform_initials puede ser multivalor (ej: O,V).
OBJECTS = [
    {"description": "Batch", "initial": "B", "platform_initials": ["Q"]},
    {"description": "On-Line", "initial": "O", "platform_initials": ["Q"]},
    {"description": "Programa", "initial": "R", "platform_initials": ["Q"]},
    {"description": "Eventual", "initial": "E", "platform_initials": ["Y"]},
    {"description": "SP", "initial": "B", "platform_initials": ["Y"]},
    {"description": "SQL", "initial": "Q", "platform_initials": ["Y"]},
    {"description": "SH", "initial": "S", "platform_initials": ["Y"]},
    {"description": "Ventana", "initial": "V", "platform_initials": ["O", "V"]},
    {"description": "Mod/Comp. Servicio de Datos", "initial": "S", "platform_initials": ["O", "V"]},
    {"description": "Mod/Comp. Acceso Tabla BD", "initial": "T", "platform_initials": ["O", "V"]},
    {"description": "Mod/Comp. Logica Aplicación", "initial": "L", "platform_initials": ["O", "V"]},
    {"description": "Reporte", "initial": "R", "platform_initials": ["O", "V"]},
    {"description": "ASP", "initial": "1", "platform_initials": ["A"]},
    {"description": "Includes", "initial": "2", "platform_initials": ["A"]},
    {"description": "Java Script", "initial": "3", "platform_initials": ["A"]},
    {"description": "Layout Html", "initial": "4", "platform_initials": ["A"]},
    {"description": "Web Service", "initial": "5", "platform_initials": ["A"]},
    {"description": "XML", "initial": "6", "platform_initials": ["A"]},
    {"description": "XSL", "initial": "7", "platform_initials": ["A"]},
    {"description": "Clase", "initial": "1", "platform_initials": ["N"]},
    {"description": "Web User Control", "initial": "2", "platform_initials": ["N"]},
    {"description": "Master Page", "initial": "3", "platform_initials": ["N"]},
    {"description": "Web Form", "initial": "4", "platform_initials": ["N"]},
    {"description": "Resource File", "initial": "5", "platform_initials": ["N"]},
    {"description": "Batch", "initial": "B", "platform_initials": ["C"]},
    {"description": "On-Line", "initial": "O", "platform_initials": ["C"]},
    {"description": "C Unix", "initial": "C", "platform_initials": ["C"]},
    {"description": "Batch", "initial": "B", "platform_initials": ["J"]},
    {"description": "On-Line", "initial": "O", "platform_initials": ["J"]},
    {"description": "Web Service JAVA", "initial": "8", "platform_initials": ["J"]},
    {"description": "Conector", "initial": "9", "platform_initials": ["J"]},
]


def _platform_map(db):
    return {p.initial: p for p in db.query(Platform).all()}


def _pair_exists(db, object_initial: str, platform_id: int) -> bool:
    return (
        db.query(ObjectMaster)
        .join(ObjectPlatform, ObjectPlatform.object_id == ObjectMaster.id)
        .filter(
            ObjectMaster.initial == object_initial,
            ObjectPlatform.platform_id == platform_id,
        )
        .first()
        is not None
    )


def seed_objects():
    Base.metadata.create_all(bind=engine)
    print("Asegurando plataformas...\n")
    seed_platforms()
    print("\nInicializando Objetos...\n")

    db = SessionLocal()
    created = 0
    skipped = 0
    try:
        platforms = _platform_map(db)
        for item in OBJECTS:
            missing = [i for i in item["platform_initials"] if i not in platforms]
            if missing:
                print(f"  [error]   {item['description']} ({item['initial']}) - plataformas inexistentes: {missing}")
                continue

            platform_ids = [platforms[i].id for i in item["platform_initials"]]
            if any(_pair_exists(db, item["initial"], pid) for pid in platform_ids):
                skipped += 1
                plats = ",".join(item["platform_initials"])
                print(f"  [omitido] {item['description']} ({item['initial']}) [{plats}] - combinación ya existe")
                continue

            record = ObjectMaster(description=item["description"], initial=item["initial"])
            db.add(record)
            db.flush()
            for pid in platform_ids:
                db.add(ObjectPlatform(object_id=record.id, platform_id=pid))
            created += 1
            plats = ",".join(item["platform_initials"])
            print(f"  [creado]  {item['description']} ({item['initial']}) [{plats}]")

        db.commit()
        print(f"\nListo: {created} creados, {skipped} omitidos.")
    except Exception as exc:
        db.rollback()
        print(f"Error: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_objects()
