from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import ComplexityChange, CatalogItem
from app.schemas import ComplexityChangeCreate, ComplexityChangeUpdate, ComplexityChangeResponse
from app.validators import validate_no_items_reference, validate_unique_initial

router = APIRouter(prefix="/api/complexity-changes", tags=["Complejidad Cambio"])


@router.get("/", response_model=List[ComplexityChangeResponse])
def list_complexity_changes(db: Session = Depends(get_db)):
    return db.query(ComplexityChange).all()


@router.get("/{cc_id}", response_model=ComplexityChangeResponse)
def get_complexity_change(cc_id: int, db: Session = Depends(get_db)):
    record = db.query(ComplexityChange).filter(ComplexityChange.id == cc_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Complejidad Cambio no encontrada")
    return record


@router.post("/", response_model=ComplexityChangeResponse, status_code=201)
def create_complexity_change(data: ComplexityChangeCreate, db: Session = Depends(get_db)):
    validate_unique_initial(db, ComplexityChange, data.initial, "Complejidad Cambio")
    record = ComplexityChange(description=data.description, initial=data.initial)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.put("/{cc_id}", response_model=ComplexityChangeResponse)
def update_complexity_change(cc_id: int, data: ComplexityChangeUpdate, db: Session = Depends(get_db)):
    record = db.query(ComplexityChange).filter(ComplexityChange.id == cc_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Complejidad Cambio no encontrada")
    if data.initial is not None:
        validate_unique_initial(db, ComplexityChange, data.initial, "Complejidad Cambio", exclude_id=cc_id)
    if data.description is not None:
        record.description = data.description
    if data.initial is not None:
        record.initial = data.initial
    db.commit()
    db.refresh(record)
    return record


@router.delete("/{cc_id}", status_code=204)
def delete_complexity_change(cc_id: int, db: Session = Depends(get_db)):
    record = db.query(ComplexityChange).filter(ComplexityChange.id == cc_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Complejidad Cambio no encontrada")
    validate_no_items_reference(db, CatalogItem.complexity_change_id, cc_id, "Complejidad Cambio")
    db.delete(record)
    db.commit()
