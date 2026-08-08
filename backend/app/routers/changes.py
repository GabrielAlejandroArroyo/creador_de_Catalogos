from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Change, CatalogItem
from app.schemas import ChangeCreate, ChangeUpdate, ChangeResponse
from app.validators import validate_no_items_reference, validate_unique_initial

router = APIRouter(prefix="/api/changes", tags=["Cambios"])


@router.get("/", response_model=List[ChangeResponse])
def list_changes(db: Session = Depends(get_db)):
    return db.query(Change).all()


@router.get("/{change_id}", response_model=ChangeResponse)
def get_change(change_id: int, db: Session = Depends(get_db)):
    record = db.query(Change).filter(Change.id == change_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Cambio no encontrado")
    return record


@router.post("/", response_model=ChangeResponse, status_code=201)
def create_change(data: ChangeCreate, db: Session = Depends(get_db)):
    validate_unique_initial(db, Change, data.initial, "Cambio")
    record = Change(description=data.description, initial=data.initial)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.put("/{change_id}", response_model=ChangeResponse)
def update_change(change_id: int, data: ChangeUpdate, db: Session = Depends(get_db)):
    record = db.query(Change).filter(Change.id == change_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Cambio no encontrado")
    if data.initial is not None:
        validate_unique_initial(db, Change, data.initial, "Cambio", exclude_id=change_id)
    if data.description is not None:
        record.description = data.description
    if data.initial is not None:
        record.initial = data.initial
    db.commit()
    db.refresh(record)
    return record


@router.delete("/{change_id}", status_code=204)
def delete_change(change_id: int, db: Session = Depends(get_db)):
    record = db.query(Change).filter(Change.id == change_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Cambio no encontrado")
    validate_no_items_reference(db, CatalogItem.change_id, change_id, "Cambio")
    db.delete(record)
    db.commit()
