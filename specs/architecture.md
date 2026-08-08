# Arquitectura del Sistema — Creador de Catálogos

> Mapa técnico del **código existente** al **2026-08-08** (línea base `v1.0.0`).  
> No propone rediseños: describe lo que ya está escrito.

---

## 1. Vista de pájaro

```text
┌─────────────────────────────┐      HTTP JSON       ┌──────────────────────────────┐
│  Frontend Angular 17        │ ───────────────────► │  Backend FastAPI             │
│  http://localhost:4200      │ ◄─────────────────── │  http://localhost:8000/api   │
│  (standalone components)    │                      │  SQLAlchemy + SQLite         │
└─────────────────────────────┘                      └──────────────┬───────────────┘
                                                                    │
                                                                    ▼
                                                         backend/catalog.db
```

- **Frontend:** SPA Angular (standalone), habla solo con `http://localhost:8000/api`.
- **Backend:** API REST FastAPI, CORS abierto (`*`).
- **Persistencia:** SQLite archivo `backend/catalog.db`.

No hay capa de autenticación ni gateway intermedio.

---

## 2. Estructura de carpetas (raíz)

```text
creador_de_Catalogos/
├── backend/                 # API Python
│   ├── app/
│   │   ├── main.py          # App FastAPI, CORS, migrations al arrancar
│   │   ├── database.py      # Engine SQLite + SessionLocal + get_db
│   │   ├── models.py        # Tablas SQLAlchemy
│   │   ├── schemas.py       # Pydantic v2 request/response
│   │   ├── validators.py    # Reglas de negocio / unicidad / código
│   │   ├── ai_service.py    # Cliente OpenAI-compatible
│   │   ├── ai_defaults.py   # Fallback Ollama gratis / RAG offline
│   │   ├── ai_rag.py        # Retrieval liviano sobre knowledge
│   │   ├── ai_knowledge/    # Markdowns de ayuda por concepto
│   │   └── routers/         # Endpoints por recurso
│   ├── requirements.txt
│   ├── catalog.db           # BD local (runtime)
│   └── seed_*.py            # Semillas de maestros
├── frontend/                # SPA Angular
│   ├── src/
│   │   ├── index.html       # lang="es"
│   │   ├── styles.css       # Design tokens claro/oscuro
│   │   └── app/
│   │       ├── app.routes.ts
│   │       ├── app.config.ts
│   │       ├── models/interfaces.ts
│   │       ├── services/    # api.service.ts, theme.service.ts
│   │       └── components/  # layout, masters, catalogs, catalog-items
│   ├── package.json
│   └── angular.json
├── scripts/                 # Bat/ps1 de arranque, stop y seeds (Windows)
├── specs/                   # Spec-Driven Development (este árbol)
└── .cursor/                 # Skills / rules del agente
```

---

## 3. Tecnologías y dependencias

### Backend (`backend/requirements.txt`)

| Paquete | Rol |
|---------|-----|
| FastAPI | API HTTP |
| uvicorn[standard] | Servidor ASGI |
| SQLAlchemy | ORM |
| pydantic>=2.0 | Schemas |
| httpx | Cliente HTTP async hacia proveedores IA |

### Frontend (`frontend/package.json`)

| Paquete | Rol |
|---------|-----|
| Angular 17 (`@angular/*` ^17.3) | UI SPA |
| rxjs | Streams HTTP / encadenar altas |
| zone.js | Change detection Angular |

**No hay** librerías de Excel/CSV externas: la exportación se arma en el cliente (CSV + SpreadsheetML).

---

## 4. Modelo de datos (tablas)

| Tabla | Campos clave | Notas |
|-------|--------------|-------|
| `platforms` | id, description, initial (UNIQUE) | Maestro |
| `objects` | id, description, initial | Sin UNIQUE global en initial |
| `object_platforms` | object_id, platform_id | N:N Objeto↔Plataforma |
| `changes` | id, description, initial (UNIQUE) | Maestro |
| `complexity_objects` | id, description, initial (UNIQUE) | Maestro |
| `complexity_changes` | id, description, initial (UNIQUE) | Maestro |
| `catalogs` | id, description, initial (UNIQUE) | Contenedor |
| `catalog_items` | catalog_id + FKs + code + time + baja_logica | Item |
| `ai_connections` | name, base_url, api_key, model_name, mode, is_active, is_enabled, updated_at | 1..N conexiones IA (una por API key); una sola `is_active` |

**Código de item** (generado en `validators.generate_code`):

```text
platform.initial + object.initial + change.initial + complexity_object.initial + complexity_change.initial
```

**Migraciones al arranque** (`main.py` lifespan):

- Recrea `objects` si todavía tenía UNIQUE en `initial`.
- Agrega `time` y `baja_logica` a `catalog_items` si faltan.
- Limpia guiones viejos en `code`.

No hay Alembic ni migraciones versionadas externas.

---

## 5. API — routers y prefijos

| Prefijo | Archivo | Operaciones típicas |
|---------|---------|---------------------|
| `/api/platforms` | `routers/platforms.py` | CRUD |
| `/api/objects` | `routers/objects.py` | CRUD + sync plataformas + GET `/{id}/platforms` |
| `/api/changes` | `routers/changes.py` | CRUD |
| `/api/complexity-objects` | `routers/complexity_objects.py` | CRUD |
| `/api/complexity-changes` | `routers/complexity_changes.py` | CRUD |
| `/api/catalogs` | `routers/catalogs.py` | CRUD |
| `/api/catalogs/{catalog_id}/items` | `routers/catalog_items.py` | list/get/create; update solo `time`; activar; delete lógica/definitiva; bulk-delete; bulk-activate |
| `/api/ai` | `routers/ai.py` | status; CRUD conexiones; use-free-opensource; activate; test; chat |

**Fallback sin API key** (`ai_defaults.py`):

1. Detecta modelos en Ollama (`/api/tags`) y elige el más “pensante” disponible (prioridad DeepSeek-R1, QwQ, Qwen3, Llama…).
2. Si Ollama no responde → chat con **RAG offline** (markdowns en `ai_knowledge/`).
3. Endpoint `POST /api/ai/connections/use-free-opensource` persiste/activa el preset local.

Validaciones centralizadas en `validators.py` (existencia, unicidad de sigla, unicidad de código, bloqueo de borrado de maestros referenciados, unicidad objeto+plataforma).

La respuesta de items viene **enriquecida** con description/initial de cada maestro (`_enrich_item`).

---

## 6. Frontend — componentes clave

| Componente | Ruta | Responsabilidad |
|------------|------|-----------------|
| `LayoutComponent` | shell | Sidebar, topbar móvil, tema claro/oscuro |
| `PlatformsComponent` | `/platforms` | ABM plataformas |
| `ObjectsComponent` | `/objects` | ABM objetos + plataformas |
| `ChangesComponent` | `/changes` | ABM cambios |
| `ComplexityObjectsComponent` | `/complexity-objects` | ABM complej. objeto |
| `ComplexityChangesComponent` | `/complexity-changes` | ABM complej. cambio |
| `CatalogsComponent` | `/catalogs` | ABM catálogos + navegación a items |
| `CatalogItemsComponent` | `/catalogs/:id/items` | Alta combinatoria, vistas, Time, export, bajas |
| `AiSettingsComponent` | `/ai-settings` | ABM 1..N conexiones IA (API key, modo, activar, probar) |
| `AiAssistantComponent` | (layout, todas las rutas) | Botón flotante siempre visible; chat o CTA a seteo |

Todos son **standalone** (template + styles + clase en el mismo `.ts`).

### Servicios

| Servicio | Rol |
|----------|-----|
| `ApiService` | Único cliente HTTP; `BASE = http://localhost:8000/api` (incluye AI) |
| `ThemeService` | Tema `light`/`dark` persistido en `localStorage` (`catalogos-theme`) |

### Pantalla más compleja: `catalog-items`

Responsabilidades concentradas en un solo componente:

- Cascada de selección Plataforma → Objeto → Cambio → Complejidades
- Preview jerárquico de códigos + exclusión de conflictos
- Alta secuencial (`from` + `concatMap`) de combinaciones
- Vistas: `full` | `summary` | `by_platform` | `db` | `db_detail` | `export`
  - `by_platform`: agrupa items en cliente por `platform_id`; nodos colapsables con meta (conteo, bajas, suma de `time`) y grilla CRUD al expandir; sin endpoint nuevo
- Time en grilla (texto localizado `es`) con pendientes/inválidos
- Formulario Editar Time con parámetros solo lectura
- Export CSV/Excel client-side (incluye formato Cocomo Catalog Web)
- Selección múltiple: activar / eliminar (modal baja lógica vs definitiva)

---

## 7. Flujo técnico de datos (ejemplo: crear item)

```text
Usuario elige combos en UI
        │
        ▼
CatalogItemsComponent.buildCombos()
        │  payload: { platform_id, object_id, change_id,
        │             complexity_object_id, complexity_change_id, time }
        ▼
ApiService.createCatalogItem(catalogId, payload)
        │  POST /api/catalogs/{id}/items/
        ▼
catalog_items.create_item
        │  validate_catalog_item_refs
        │  generate_code
        │  validate_unique_code
        │  INSERT catalog_items
        ▼
_enrich_item → CatalogItemResponse (JSON)
        │
        ▼
UI recarga lista (getCatalogItems)
```

### Ejemplo: editar Time desde grilla

```text
Usuario escribe "2,31" en input texto
        │
        ▼
parseLocaleNumber (coma → 2.31 float)
        │  si falla → badge "inválido" (no se envía)
        ▼
PUT /api/catalogs/{id}/items/{itemId}  body: { "time": 2.31 }
        │
        ▼
update_item (bloquea si baja_logica)
        ▼
SQLite FLOAT actualizado
```

### Ejemplo: exportar

```text
items[] ya en memoria del componente
        │
        ▼
buildExportTable(columnSet) → headers + rows
        │
        ├─► toCsv → Blob download .csv
        └─► toExcelXml → Blob download .xls
```

### Ejemplo: asistente IA

```text
Usuario abre botón flotante IA (siempre en layout)
        │
        ▼
GET /api/ai/status
        │
        ├─ configured=false → pregunta + navigate /ai-settings
        │
        └─ configured=true → POST /api/ai/chat { message, concept? }
                │
                ▼
           pick conexión is_active usable
                │
                ├─ mode=foundational → httpx → /v1/chat/completions
                └─ mode=foundational_rag → ai_rag.retrieve_context
                                           + httpx → /v1/chat/completions
```

---

## 8. UI / tema

- Tokens CSS en `frontend/src/styles.css` (`--color-*`, sidebar, botones, tablas).
- Tema vía `data-theme="light|dark"` en `<html>`.
- Skill de UX del proyecto: `.cursor/skills/catalogos-ux-ui/SKILL.md` (pantalla completa, responsive, consistencia de clases).

---

## 9. Scripts operativos

| Script | Función |
|--------|---------|
| `scripts/start_all.bat` | Levanta backend + frontend |
| `scripts/start_backend.bat` / `start_frontend.bat` | Servicios sueltos |
| `scripts/stop_all.bat` | Detiene procesos |
| `scripts/seed_*.bat` + `backend/seed_*.py` | Carga maestros |
| `scripts/backup_proyecto_github.ps1` | Backup / GitHub (utilitario) |

---

## 10. Límites técnicos actuales (hechos, no backlog)

- URL del API **hardcodeada** en el frontend (`localhost:8000`).
- SQLite de un solo archivo; sin entornos staging/prod separados en código.
- CORS permisivo.
- Lógica de items muy concentrada en un componente grande.
- Exportación 100% client-side.
- Conexiones IA editables sin auth; API keys en SQLite (enmascaradas en listados).
- Sin API key: fallback Ollama local (DeepSeek-R1 preferido) o RAG offline.
- RAG sin vector DB: score por tokens sobre markdowns en `ai_knowledge/`.
