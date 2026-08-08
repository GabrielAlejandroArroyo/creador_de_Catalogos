from typing import Optional, List
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models import (
    Platform, ObjectMaster, ObjectPlatform, Change,
    ComplexityObject, ComplexityChange, Catalog, CatalogItem,
)


def validate_exists(db: Session, model, record_id: int, label: str):
    record = db.query(model).filter(model.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail=f"{label} con id {record_id} no existe")
    return record


def validate_platform_exists(db: Session, platform_id: int):
    return validate_exists(db, Platform, platform_id, "Plataforma")


def validate_object_exists(db: Session, object_id: int):
    return validate_exists(db, ObjectMaster, object_id, "Objeto")


def validate_change_exists(db: Session, change_id: int):
    return validate_exists(db, Change, change_id, "Cambio")


def validate_complexity_object_exists(db: Session, co_id: int):
    return validate_exists(db, ComplexityObject, co_id, "Complejidad Objeto")


def validate_complexity_change_exists(db: Session, cc_id: int):
    return validate_exists(db, ComplexityChange, cc_id, "Complejidad Cambio")


def validate_catalog_exists(db: Session, catalog_id: int):
    return validate_exists(db, Catalog, catalog_id, "Catálogo")


def validate_catalog_item_refs(db: Session, catalog_id: int, platform_id: int,
                                object_id: int, change_id: int,
                                complexity_object_id: int, complexity_change_id: int):
    """Valida que todos los IDs referenciados en un CatalogItem existan."""
    validate_catalog_exists(db, catalog_id)
    platform = validate_platform_exists(db, platform_id)
    obj = validate_object_exists(db, object_id)
    change = validate_change_exists(db, change_id)
    co = validate_complexity_object_exists(db, complexity_object_id)
    cc = validate_complexity_change_exists(db, complexity_change_id)
    return platform, obj, change, co, cc


def generate_code(platform: Platform, obj: ObjectMaster, change: Change,
                  co: ComplexityObject, cc: ComplexityChange) -> str:
    return f"{platform.initial}{obj.initial}{change.initial}{co.initial}{cc.initial}"


def validate_unique_code(db: Session, catalog_id: int, code: str, exclude_item_id: Optional[int] = None):
    query = db.query(CatalogItem).filter(
        CatalogItem.catalog_id == catalog_id,
        CatalogItem.code == code,
    )
    if exclude_item_id is not None:
        query = query.filter(CatalogItem.id != exclude_item_id)
    if query.first():
        raise HTTPException(
            status_code=409,
            detail=f"Ya existe un item con el código '{code}' en este catálogo",
        )


def validate_no_items_reference(db: Session, column, value: int, label: str):
    """Verifica que ningun CatalogItem referencie este registro antes de eliminarlo."""
    item = db.query(CatalogItem).filter(column == value).first()
    if item:
        raise HTTPException(
            status_code=409,
            detail=f"No se puede eliminar: existen items que referencian este {label}",
        )


def validate_unique_initial(db: Session, model, initial: str, label: str, exclude_id: Optional[int] = None):
    query = db.query(model).filter(model.initial == initial)
    if exclude_id is not None:
        query = query.filter(model.id != exclude_id)
    if query.first():
        raise HTTPException(
            status_code=409,
            detail=f"Ya existe un {label} con la sigla '{initial}'",
        )


def validate_object_unique_per_platform(
    db: Session,
    initial: str,
    platform_ids: List[int],
    exclude_id: Optional[int] = None,
):
    """
    Unicidad de Objeto = (sigla objeto + sigla plataforma).
    No puede existir otro objeto con la misma sigla asociado a la misma plataforma.
    """
    if not platform_ids:
        raise HTTPException(
            status_code=400,
            detail="Debe asociar al menos una plataforma. La unicidad es por sigla de objeto + sigla de plataforma.",
        )

    requested = set(platform_ids)
    conflicting_platforms = []

    for platform_id in requested:
        platform = validate_platform_exists(db, platform_id)
        rows = (
            db.query(ObjectMaster)
            .join(ObjectPlatform, ObjectPlatform.object_id == ObjectMaster.id)
            .filter(
                ObjectMaster.initial == initial,
                ObjectPlatform.platform_id == platform_id,
            )
        )
        if exclude_id is not None:
            rows = rows.filter(ObjectMaster.id != exclude_id)
        if rows.first():
            label = f"{platform.description} ({platform.initial})"
            if label not in conflicting_platforms:
                conflicting_platforms.append(label)

    if conflicting_platforms:
        detail = (
            f"Ya existe la combinación sigla objeto '{initial}' "
            f"con plataforma(s): {', '.join(conflicting_platforms)}"
        )
        raise HTTPException(status_code=409, detail=detail)
