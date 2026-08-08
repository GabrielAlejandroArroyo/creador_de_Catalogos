from sqlalchemy import Column, Integer, String, Float, Boolean
from app.database import Base


class Platform(Base):
    __tablename__ = "platforms"
    id = Column(Integer, primary_key=True, autoincrement=True)
    description = Column(String, nullable=False)
    initial = Column(String, nullable=False, unique=True)


class ObjectMaster(Base):
    __tablename__ = "objects"
    id = Column(Integer, primary_key=True, autoincrement=True)
    description = Column(String, nullable=False)
    initial = Column(String, nullable=False)


class ObjectPlatform(Base):
    __tablename__ = "object_platforms"
    id = Column(Integer, primary_key=True, autoincrement=True)
    object_id = Column(Integer, nullable=False)
    platform_id = Column(Integer, nullable=False)


class Change(Base):
    __tablename__ = "changes"
    id = Column(Integer, primary_key=True, autoincrement=True)
    description = Column(String, nullable=False)
    initial = Column(String, nullable=False, unique=True)


class ComplexityObject(Base):
    __tablename__ = "complexity_objects"
    id = Column(Integer, primary_key=True, autoincrement=True)
    description = Column(String, nullable=False)
    initial = Column(String, nullable=False, unique=True)


class ComplexityChange(Base):
    __tablename__ = "complexity_changes"
    id = Column(Integer, primary_key=True, autoincrement=True)
    description = Column(String, nullable=False)
    initial = Column(String, nullable=False, unique=True)


class Catalog(Base):
    __tablename__ = "catalogs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    description = Column(String, nullable=False)
    initial = Column(String, nullable=False, unique=True)


class CatalogItem(Base):
    __tablename__ = "catalog_items"
    id = Column(Integer, primary_key=True, autoincrement=True)
    catalog_id = Column(Integer, nullable=False)
    platform_id = Column(Integer, nullable=False)
    object_id = Column(Integer, nullable=False)
    change_id = Column(Integer, nullable=False)
    complexity_object_id = Column(Integer, nullable=False)
    complexity_change_id = Column(Integer, nullable=False)
    code = Column(String, nullable=False)
    time = Column(Float, nullable=False, default=0)
    baja_logica = Column(Boolean, nullable=False, default=False)


class AiConnection(Base):
    __tablename__ = "ai_connections"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    base_url = Column(String, nullable=False, default="https://api.openai.com/v1")
    api_key = Column(String, nullable=False, default="")
    model_name = Column(String, nullable=False)
    mode = Column(String, nullable=False, default="foundational")  # foundational | foundational_rag
    is_active = Column(Boolean, nullable=False, default=False)
    is_enabled = Column(Boolean, nullable=False, default=True)
    updated_at = Column(String, nullable=True)
