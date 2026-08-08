from typing import Optional, List
from pydantic import BaseModel, ConfigDict


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


# --- AI connections ---
class AiConnectionCreate(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    name: str
    base_url: str = "http://127.0.0.1:11434/v1"
    api_key: Optional[str] = ""  # opcional si es Ollama/local gratis
    model_name: str
    mode: str = "foundational"  # foundational | foundational_rag
    is_enabled: bool = True
    activate: bool = False


class AiConnectionUpdate(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    name: Optional[str] = None
    base_url: Optional[str] = None
    api_key: Optional[str] = None  # vacío = sin key (gratis/local)
    model_name: Optional[str] = None
    mode: Optional[str] = None
    is_enabled: Optional[bool] = None


class AiConnectionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())
    id: int
    name: str
    base_url: str
    api_key_masked: str
    model_name: str
    mode: str
    is_active: bool
    is_enabled: bool
    updated_at: Optional[str] = None


class AiStatusResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    configured: bool
    active_connection_id: Optional[int] = None
    active_connection_name: Optional[str] = None
    mode: Optional[str] = None
    model_name: Optional[str] = None
    connections_count: int = 0
    provider_kind: str = "rag_offline"  # custom | ollama_free | rag_offline
    using_free_opensource: bool = True
    requires_api_key: bool = False


class AiChatRequest(BaseModel):
    message: str
    concept: Optional[str] = None


class AiChatResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    reply: str
    mode: str
    connection_name: str
    model_name: str
    sources: List[str] = []
    provider_kind: str = "custom"


class AiTestResponse(BaseModel):
    ok: bool
    detail: str
