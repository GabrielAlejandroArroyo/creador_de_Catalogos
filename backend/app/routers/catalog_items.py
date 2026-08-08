from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import CatalogItem
from app.schemas import (
    CatalogItemCreate, CatalogItemUpdate, CatalogItemResponse,
    CatalogItemBulkDelete, CatalogItemBulkActivate,
)
from app.validators import (
    validate_catalog_item_refs, generate_code, validate_unique_code,
    validate_catalog_exists,
)

router = APIRouter(prefix="/api/catalogs/{catalog_id}/items", tags=["Items de Catálogo"])


def _enrich_item(db: Session, item: CatalogItem) -> CatalogItemResponse:
    from app.models import Platform, ObjectMaster, Change, ComplexityObject, ComplexityChange
    platform = db.query(Platform).filter(Platform.id == item.platform_id).first()
    obj = db.query(ObjectMaster).filter(ObjectMaster.id == item.object_id).first()
    change = db.query(Change).filter(Change.id == item.change_id).first()
    co = db.query(ComplexityObject).filter(ComplexityObject.id == item.complexity_object_id).first()
    cc = db.query(ComplexityChange).filter(ComplexityChange.id == item.complexity_change_id).first()
    return CatalogItemResponse(
        id=item.id,
        catalog_id=item.catalog_id,
        platform_id=item.platform_id,
        object_id=item.object_id,
        change_id=item.change_id,
        complexity_object_id=item.complexity_object_id,
        complexity_change_id=item.complexity_change_id,
        code=item.code,
        time=item.time if item.time is not None else 0,
        baja_logica=bool(item.baja_logica) if item.baja_logica is not None else False,
        platform_description=platform.description if platform else "",
        platform_initial=platform.initial if platform else "",
        object_description=obj.description if obj else "",
        object_initial=obj.initial if obj else "",
        change_description=change.description if change else "",
        change_initial=change.initial if change else "",
        complexity_object_description=co.description if co else "",
        complexity_object_initial=co.initial if co else "",
        complexity_change_description=cc.description if cc else "",
        complexity_change_initial=cc.initial if cc else "",
    )


@router.get("/", response_model=List[CatalogItemResponse])
def list_items(catalog_id: int, db: Session = Depends(get_db)):
    validate_catalog_exists(db, catalog_id)
    items = db.query(CatalogItem).filter(CatalogItem.catalog_id == catalog_id).all()
    return [_enrich_item(db, item) for item in items]


@router.get("/{item_id}", response_model=CatalogItemResponse)
def get_item(catalog_id: int, item_id: int, db: Session = Depends(get_db)):
    validate_catalog_exists(db, catalog_id)
    item = db.query(CatalogItem).filter(
        CatalogItem.id == item_id, CatalogItem.catalog_id == catalog_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    return _enrich_item(db, item)


@router.post("/", response_model=CatalogItemResponse, status_code=201)
def create_item(catalog_id: int, data: CatalogItemCreate, db: Session = Depends(get_db)):
    platform, obj, change, co, cc = validate_catalog_item_refs(
        db, catalog_id, data.platform_id, data.object_id,
        data.change_id, data.complexity_object_id, data.complexity_change_id,
    )
    code = generate_code(platform, obj, change, co, cc)
    validate_unique_code(db, catalog_id, code)

    item = CatalogItem(
        catalog_id=catalog_id,
        platform_id=data.platform_id,
        object_id=data.object_id,
        change_id=data.change_id,
        complexity_object_id=data.complexity_object_id,
        complexity_change_id=data.complexity_change_id,
        code=code,
        time=data.time if data.time is not None else 0,
        baja_logica=False,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return _enrich_item(db, item)


@router.put("/{item_id}", response_model=CatalogItemResponse)
def update_item(catalog_id: int, item_id: int, data: CatalogItemUpdate, db: Session = Depends(get_db)):
    """Solo permite editar Time; el resto del item no se modifica."""
    validate_catalog_exists(db, catalog_id)
    item = db.query(CatalogItem).filter(
        CatalogItem.id == item_id, CatalogItem.catalog_id == catalog_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    if item.baja_logica:
        raise HTTPException(status_code=409, detail="No se puede editar un item con baja lógica")

    item.time = data.time if data.time is not None else 0
    db.commit()
    db.refresh(item)
    return _enrich_item(db, item)


@router.post("/{item_id}/activar", response_model=CatalogItemResponse)
def activate_item(catalog_id: int, item_id: int, db: Session = Depends(get_db)):
    """Quita la baja lógica y vuelve a activar el item."""
    validate_catalog_exists(db, catalog_id)
    item = db.query(CatalogItem).filter(
        CatalogItem.id == item_id, CatalogItem.catalog_id == catalog_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    if not item.baja_logica:
        raise HTTPException(status_code=409, detail="El item ya está activo")

    item.baja_logica = False
    db.commit()
    db.refresh(item)
    return _enrich_item(db, item)


@router.delete("/{item_id}", status_code=200)
def delete_item(
    catalog_id: int,
    item_id: int,
    definitiva: bool = Query(False, description="True = baja definitiva, False = baja lógica"),
    db: Session = Depends(get_db),
):
    validate_catalog_exists(db, catalog_id)
    item = db.query(CatalogItem).filter(
        CatalogItem.id == item_id, CatalogItem.catalog_id == catalog_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado")

    if definitiva:
        db.delete(item)
        db.commit()
        return {"mode": "definitiva", "deleted": 1}

    if item.baja_logica:
        raise HTTPException(status_code=409, detail="El item ya tiene baja lógica")
    item.baja_logica = True
    db.commit()
    return {"mode": "logica", "deleted": 0, "updated": 1}


@router.post("/bulk-delete", status_code=200)
def bulk_delete_items(catalog_id: int, data: CatalogItemBulkDelete, db: Session = Depends(get_db)):
    validate_catalog_exists(db, catalog_id)
    if not data.item_ids:
        raise HTTPException(status_code=400, detail="Debe indicar al menos un item a eliminar")

    items = (
        db.query(CatalogItem)
        .filter(CatalogItem.catalog_id == catalog_id, CatalogItem.id.in_(data.item_ids))
        .all()
    )
    if not items:
        raise HTTPException(status_code=404, detail="No se encontraron items a eliminar")

    if data.definitiva:
        for item in items:
            db.delete(item)
        db.commit()
        return {"mode": "definitiva", "deleted": len(items), "updated": 0}

    updated = 0
    for item in items:
        if not item.baja_logica:
            item.baja_logica = True
            updated += 1
    db.commit()
    return {"mode": "logica", "deleted": 0, "updated": updated}


@router.post("/bulk-activate", status_code=200)
def bulk_activate_items(catalog_id: int, data: CatalogItemBulkActivate, db: Session = Depends(get_db)):
    validate_catalog_exists(db, catalog_id)
    if not data.item_ids:
        raise HTTPException(status_code=400, detail="Debe indicar al menos un item a activar")

    items = (
        db.query(CatalogItem)
        .filter(CatalogItem.catalog_id == catalog_id, CatalogItem.id.in_(data.item_ids))
        .all()
    )
    if not items:
        raise HTTPException(status_code=404, detail="No se encontraron items a activar")

    activated = 0
    for item in items:
        if item.baja_logica:
            item.baja_logica = False
            activated += 1
    db.commit()
    return {"activated": activated}
