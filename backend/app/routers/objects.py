from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import ObjectMaster, ObjectPlatform, CatalogItem
from app.schemas import ObjectCreate, ObjectUpdate, ObjectResponse, PlatformResponse
from app.validators import (
    validate_platform_exists, validate_no_items_reference,
    validate_object_unique_per_platform,
)

router = APIRouter(prefix="/api/objects", tags=["Objetos"])


def _get_platform_ids(db: Session, object_id: int) -> List[int]:
    rows = db.query(ObjectPlatform.platform_id).filter(
        ObjectPlatform.object_id == object_id
    ).all()
    return [r[0] for r in rows]


def _sync_platforms(db: Session, object_id: int, platform_ids: List[int]):
    for pid in platform_ids:
        validate_platform_exists(db, pid)
    db.query(ObjectPlatform).filter(ObjectPlatform.object_id == object_id).delete()
    for pid in platform_ids:
        db.add(ObjectPlatform(object_id=object_id, platform_id=pid))


@router.get("/", response_model=List[ObjectResponse])
def list_objects(db: Session = Depends(get_db)):
    records = db.query(ObjectMaster).all()
    result = []
    for r in records:
        result.append(ObjectResponse(
            id=r.id, description=r.description, initial=r.initial,
            platform_ids=_get_platform_ids(db, r.id),
        ))
    return result


@router.get("/{object_id}", response_model=ObjectResponse)
def get_object(object_id: int, db: Session = Depends(get_db)):
    record = db.query(ObjectMaster).filter(ObjectMaster.id == object_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Objeto no encontrado")
    return ObjectResponse(
        id=record.id, description=record.description, initial=record.initial,
        platform_ids=_get_platform_ids(db, record.id),
    )


@router.get("/{object_id}/platforms", response_model=List[PlatformResponse])
def get_object_platforms(object_id: int, db: Session = Depends(get_db)):
    record = db.query(ObjectMaster).filter(ObjectMaster.id == object_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Objeto no encontrado")
    from app.models import Platform
    pids = _get_platform_ids(db, object_id)
    return db.query(Platform).filter(Platform.id.in_(pids)).all() if pids else []


@router.post("/", response_model=ObjectResponse, status_code=201)
def create_object(data: ObjectCreate, db: Session = Depends(get_db)):
    validate_object_unique_per_platform(db, data.initial, data.platform_ids)
    record = ObjectMaster(description=data.description, initial=data.initial)
    db.add(record)
    db.flush()
    if data.platform_ids:
        _sync_platforms(db, record.id, data.platform_ids)
    db.commit()
    db.refresh(record)
    return ObjectResponse(
        id=record.id, description=record.description, initial=record.initial,
        platform_ids=_get_platform_ids(db, record.id),
    )


@router.put("/{object_id}", response_model=ObjectResponse)
def update_object(object_id: int, data: ObjectUpdate, db: Session = Depends(get_db)):
    record = db.query(ObjectMaster).filter(ObjectMaster.id == object_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Objeto no encontrado")

    next_initial = data.initial if data.initial is not None else record.initial
    next_platform_ids = (
        data.platform_ids
        if data.platform_ids is not None
        else _get_platform_ids(db, object_id)
    )
    validate_object_unique_per_platform(
        db, next_initial, next_platform_ids, exclude_id=object_id
    )

    if data.description is not None:
        record.description = data.description
    if data.initial is not None:
        record.initial = data.initial
    if data.platform_ids is not None:
        _sync_platforms(db, object_id, data.platform_ids)
    db.commit()
    db.refresh(record)
    return ObjectResponse(
        id=record.id, description=record.description, initial=record.initial,
        platform_ids=_get_platform_ids(db, record.id),
    )


@router.delete("/{object_id}", status_code=204)
def delete_object(object_id: int, db: Session = Depends(get_db)):
    record = db.query(ObjectMaster).filter(ObjectMaster.id == object_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Objeto no encontrado")
    validate_no_items_reference(db, CatalogItem.object_id, object_id, "Objeto")
    db.query(ObjectPlatform).filter(ObjectPlatform.object_id == object_id).delete()
    db.delete(record)
    db.commit()
