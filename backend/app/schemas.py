from typing import Optional, List
from pydantic import BaseModel


# --- Platform ---
class PlatformCreate(BaseModel):
    description: str
    initial: str

class PlatformUpdate(BaseModel):
    description: Optional[str] = None
    initial: Optional[str] = None

class PlatformResponse(BaseModel):
    id: int
    description: str
    initial: str
    model_config = {"from_attributes": True}


# --- Object ---
class ObjectCreate(BaseModel):
    description: str
    initial: str
    platform_ids: List[int] = []

class ObjectUpdate(BaseModel):
    description: Optional[str] = None
    initial: Optional[str] = None
    platform_ids: Optional[List[int]] = None

class ObjectResponse(BaseModel):
    id: int
    description: str
    initial: str
    platform_ids: List[int] = []
    model_config = {"from_attributes": True}


# --- Change ---
class ChangeCreate(BaseModel):
    description: str
    initial: str

class ChangeUpdate(BaseModel):
    description: Optional[str] = None
    initial: Optional[str] = None

class ChangeResponse(BaseModel):
    id: int
    description: str
    initial: str
    model_config = {"from_attributes": True}


# --- ComplexityObject ---
class ComplexityObjectCreate(BaseModel):
    description: str
    initial: str

class ComplexityObjectUpdate(BaseModel):
    description: Optional[str] = None
    initial: Optional[str] = None

class ComplexityObjectResponse(BaseModel):
    id: int
    description: str
    initial: str
    model_config = {"from_attributes": True}


# --- ComplexityChange ---
class ComplexityChangeCreate(BaseModel):
    description: str
    initial: str

class ComplexityChangeUpdate(BaseModel):
    description: Optional[str] = None
    initial: Optional[str] = None

class ComplexityChangeResponse(BaseModel):
    id: int
    description: str
    initial: str
    model_config = {"from_attributes": True}


# --- Catalog ---
class CatalogCreate(BaseModel):
    description: str
    initial: str

class CatalogUpdate(BaseModel):
    description: Optional[str] = None
    initial: Optional[str] = None

class CatalogResponse(BaseModel):
    id: int
    description: str
    initial: str
    model_config = {"from_attributes": True}


# --- CatalogItem ---
class CatalogItemCreate(BaseModel):
    platform_id: int
    object_id: int
    change_id: int
    complexity_object_id: int
    complexity_change_id: int
    time: float = 0

class CatalogItemUpdate(BaseModel):
    time: float

class CatalogItemBulkDelete(BaseModel):
    item_ids: List[int]
    definitiva: bool = False

class CatalogItemBulkActivate(BaseModel):
    item_ids: List[int]

class CatalogItemResponse(BaseModel):
    id: int
    catalog_id: int
    platform_id: int
    object_id: int
    change_id: int
    complexity_object_id: int
    complexity_change_id: int
    code: str
    time: float = 0
    baja_logica: bool = False
    platform_description: str = ""
    platform_initial: str = ""
    object_description: str = ""
    object_initial: str = ""
    change_description: str = ""
    change_initial: str = ""
    complexity_object_description: str = ""
    complexity_object_initial: str = ""
    complexity_change_description: str = ""
    complexity_change_initial: str = ""
    model_config = {"from_attributes": True}
