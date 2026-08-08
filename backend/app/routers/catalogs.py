from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Catalog, CatalogItem
from app.schemas import CatalogCreate, CatalogUpdate, CatalogResponse
from app.validators import validate_unique_initial

router = APIRouter(prefix="/api/catalogs", tags=["Catálogos"])


@router.get("/", response_model=List[CatalogResponse])
def list_catalogs(db: Session = Depends(get_db)):
    return db.query(Catalog).all()


@router.get("/{catalog_id}", response_model=CatalogResponse)
def get_catalog(catalog_id: int, db: Session = Depends(get_db)):
    record = db.query(Catalog).filter(Catalog.id == catalog_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Catálogo no encontrado")
    return record


@router.post("/", response_model=CatalogResponse, status_code=201)
def create_catalog(data: CatalogCreate, db: Session = Depends(get_db)):
    validate_unique_initial(db, Catalog, data.initial, "Catálogo")
    record = Catalog(description=data.description, initial=data.initial)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.put("/{catalog_id}", response_model=CatalogResponse)
def update_catalog(catalog_id: int, data: CatalogUpdate, db: Session = Depends(get_db)):
    record = db.query(Catalog).filter(Catalog.id == catalog_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Catálogo no encontrado")
    if data.initial is not None:
        validate_unique_initial(db, Catalog, data.initial, "Catálogo", exclude_id=catalog_id)
    if data.description is not None:
        record.description = data.description
    if data.initial is not None:
        record.initial = data.initial
    db.commit()
    db.refresh(record)
    return record


@router.delete("/{catalog_id}", status_code=204)
def delete_catalog(catalog_id: int, db: Session = Depends(get_db)):
    record = db.query(Catalog).filter(Catalog.id == catalog_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Catálogo no encontrado")
    items_count = db.query(CatalogItem).filter(CatalogItem.catalog_id == catalog_id).count()
    if items_count > 0:
        raise HTTPException(
            status_code=409,
            detail=f"No se puede eliminar: el catálogo tiene {items_count} item(s) asociados",
        )
    db.delete(record)
    db.commit()
