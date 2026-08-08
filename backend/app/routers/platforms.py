from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Platform, CatalogItem
from app.schemas import PlatformCreate, PlatformUpdate, PlatformResponse
from app.validators import validate_no_items_reference, validate_unique_initial

router = APIRouter(prefix="/api/platforms", tags=["Plataformas"])


@router.get("/", response_model=List[PlatformResponse])
def list_platforms(db: Session = Depends(get_db)):
    return db.query(Platform).all()


@router.get("/{platform_id}", response_model=PlatformResponse)
def get_platform(platform_id: int, db: Session = Depends(get_db)):
    record = db.query(Platform).filter(Platform.id == platform_id).first()
    if not record:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Plataforma no encontrada")
    return record


@router.post("/", response_model=PlatformResponse, status_code=201)
def create_platform(data: PlatformCreate, db: Session = Depends(get_db)):
    validate_unique_initial(db, Platform, data.initial, "Plataforma")
    record = Platform(description=data.description, initial=data.initial)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.put("/{platform_id}", response_model=PlatformResponse)
def update_platform(platform_id: int, data: PlatformUpdate, db: Session = Depends(get_db)):
    record = db.query(Platform).filter(Platform.id == platform_id).first()
    if not record:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Plataforma no encontrada")
    if data.initial is not None:
        validate_unique_initial(db, Platform, data.initial, "Plataforma", exclude_id=platform_id)
    if data.description is not None:
        record.description = data.description
    if data.initial is not None:
        record.initial = data.initial
    db.commit()
    db.refresh(record)
    return record


@router.delete("/{platform_id}", status_code=204)
def delete_platform(platform_id: int, db: Session = Depends(get_db)):
    record = db.query(Platform).filter(Platform.id == platform_id).first()
    if not record:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Plataforma no encontrada")
    validate_no_items_reference(db, CatalogItem.platform_id, platform_id, "Plataforma")
    db.delete(record)
    db.commit()
