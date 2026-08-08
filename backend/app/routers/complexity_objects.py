from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import ComplexityObject, CatalogItem
from app.schemas import ComplexityObjectCreate, ComplexityObjectUpdate, ComplexityObjectResponse
from app.validators import validate_no_items_reference, validate_unique_initial

router = APIRouter(prefix="/api/complexity-objects", tags=["Complejidad Objeto"])


@router.get("/", response_model=List[ComplexityObjectResponse])
def list_complexity_objects(db: Session = Depends(get_db)):
    return db.query(ComplexityObject).all()


@router.get("/{co_id}", response_model=ComplexityObjectResponse)
def get_complexity_object(co_id: int, db: Session = Depends(get_db)):
    record = db.query(ComplexityObject).filter(ComplexityObject.id == co_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Complejidad Objeto no encontrada")
    return record


@router.post("/", response_model=ComplexityObjectResponse, status_code=201)
def create_complexity_object(data: ComplexityObjectCreate, db: Session = Depends(get_db)):
    validate_unique_initial(db, ComplexityObject, data.initial, "Complejidad Objeto")
    record = ComplexityObject(description=data.description, initial=data.initial)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.put("/{co_id}", response_model=ComplexityObjectResponse)
def update_complexity_object(co_id: int, data: ComplexityObjectUpdate, db: Session = Depends(get_db)):
    record = db.query(ComplexityObject).filter(ComplexityObject.id == co_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Complejidad Objeto no encontrada")
    if data.initial is not None:
        validate_unique_initial(db, ComplexityObject, data.initial, "Complejidad Objeto", exclude_id=co_id)
    if data.description is not None:
        record.description = data.description
    if data.initial is not None:
        record.initial = data.initial
    db.commit()
    db.refresh(record)
    return record


@router.delete("/{co_id}", status_code=204)
def delete_complexity_object(co_id: int, db: Session = Depends(get_db)):
    record = db.query(ComplexityObject).filter(ComplexityObject.id == co_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Complejidad Objeto no encontrada")
    validate_no_items_reference(db, CatalogItem.complexity_object_id, co_id, "Complejidad Objeto")
    db.delete(record)
    db.commit()
