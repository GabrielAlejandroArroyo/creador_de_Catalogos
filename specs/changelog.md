# Changelog — Control de Cambios Versionado

Formato de cada entrada:

- **Versión** correlativa (`vMAJOR.MINOR.PATCH`)
- **Fecha**
- **Tipo:** `Línea base` | `Nueva Función` | `Refactor` | `Corrección` | `Documentación`
- **Descripción APB** (qué cambió, en simple)
- **Archivos afectados**

Regla: todo cambio de código del agente **debe** sumar una entrada aquí y actualizar `requirements.md` / `architecture.md` si aplica.

---

## v1.0.4 — 2026-08-08

**Tipo:** Nueva Función  

**Título:** CI/CD versionado + publicación en GitHub Pages  

**Descripción APB:**  
El proyecto se valida solo en GitHub (build backend/frontend), publica Releases con la versión del changelog y deja la UI del frontend en GitHub Pages con un enlace público. El backend sigue siendo local.

**Archivos afectados:**

- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
- `.github/workflows/pages.yml`
- `frontend/src/environments/environment.ts`
- `frontend/src/environments/environment.prod.ts`
- `frontend/src/app/services/api.service.ts`
- `frontend/angular.json`
- `frontend/package.json`
- `README.md`
- `specs/requirements.md`
- `specs/architecture.md`
- `specs/changelog.md`
- `specs/README.md`

---

## v1.0.3 — 2026-08-08

**Tipo:** Nueva Función  

**Título:** Sin API key → modelo open source gratis (Ollama / DeepSeek-R1) o RAG local  

**Descripción APB:**  
Si no cargás API key, el asistente igual funciona: intenta Ollama local con el modelo open source más “pensante” disponible (prioridad DeepSeek-R1) y, si no hay Ollama, responde con la ayuda local (RAG). En Mantenimiento IA hay un botón para activar ese preset gratis.

**Archivos afectados:**

- `backend/app/ai_defaults.py`
- `backend/app/ai_service.py`
- `backend/app/routers/ai.py`
- `backend/app/schemas.py`
- `backend/app/ai_knowledge/asistente_ia.md`
- `frontend/src/app/models/interfaces.ts`
- `frontend/src/app/services/api.service.ts`
- `frontend/src/app/components/ai-assistant/ai-assistant.component.ts`
- `frontend/src/app/components/ai-settings/ai-settings.component.ts`
- `specs/requirements.md`
- `specs/architecture.md`
- `specs/changelog.md`

---

## v1.0.2 — 2026-08-08

**Tipo:** Nueva Función  

**Título:** Asistente IA siempre visible + Mantenimiento de conexiones (1..N)  

**Descripción APB:**  
En todas las pantallas aparece el botón **IA**. Si no hay modelo configurado, el panel pregunta si querés configurarlo y te lleva a **Mantenimiento IA**, donde podés cargar una o varias conexiones (cada una con su API key), elegir modo Fundacional o Fundacional+RAG, probar y activar una sola para el chat. El asistente explica conceptos de la app; el RAG usa docs locales de ayuda, no la base de catálogos.

**Archivos afectados:**

- `backend/requirements.txt`
- `backend/app/models.py`
- `backend/app/schemas.py`
- `backend/app/main.py`
- `backend/app/ai_service.py`
- `backend/app/ai_rag.py`
- `backend/app/ai_knowledge/*.md`
- `backend/app/routers/ai.py`
- `frontend/src/app/models/interfaces.ts`
- `frontend/src/app/services/api.service.ts`
- `frontend/src/app/app.routes.ts`
- `frontend/src/app/components/layout/layout.component.ts`
- `frontend/src/app/components/ai-settings/ai-settings.component.ts`
- `frontend/src/app/components/ai-assistant/ai-assistant.component.ts`
- `specs/requirements.md`
- `specs/architecture.md`
- `specs/changelog.md`

---

## v1.0.1 — 2026-08-08

**Tipo:** Nueva Función  

**Título:** Vista por plataforma en items de catálogo  

**Descripción APB:**  
En la pantalla de items apareció un tab nuevo, **Vista por plataforma**, entre Vista resumida y Vista base de datos. Agrupa los items por plataforma en nodos desplegables: arriba ves cuántos hay, cuántos están de baja y la suma de Time; al abrir el nodo ves la tabla para editar, activar o eliminar. La Vista resumida (árbol de varios niveles) sigue igual.

**Archivos afectados:**

- `frontend/src/app/components/catalog-items/catalog-items.component.ts`
- `specs/requirements.md`
- `specs/architecture.md`
- `specs/changelog.md`

---

## v1.0.0 — 2026-08-08

**Tipo:** Línea base / Documentación  

**Título:** Línea base: Análisis inicial del código existente en curso  

**Descripción APB:**  
Se abrió el proyecto tal como estaba, se leyó backend + frontend + scripts, y se escribió la carpeta `/specs` para que cualquiera entienda qué hace el sistema hoy, cómo está armado y qué NO hace. No se inventó lógica nueva en esta versión: solo se documentó e incorporó el proceso Spec-Driven Development (SDD).

**Módulos / archivos absorbidos en esta línea base:**

### Specs (creados)

- `specs/README.md`
- `specs/requirements.md`
- `specs/architecture.md`
- `specs/changelog.md` (este archivo)
- `.cursor/rules/spec-driven-development.mdc` (regla obligatoria del agente)

### Backend (estado absorbido)

- `backend/app/main.py`
- `backend/app/database.py`
- `backend/app/models.py`
- `backend/app/schemas.py`
- `backend/app/validators.py`
- `backend/app/routers/platforms.py`
- `backend/app/routers/objects.py`
- `backend/app/routers/changes.py`
- `backend/app/routers/complexity_objects.py`
- `backend/app/routers/complexity_changes.py`
- `backend/app/routers/catalogs.py`
- `backend/app/routers/catalog_items.py`
- `backend/requirements.txt`
- `backend/seed_platforms.py`
- `backend/seed_objects.py`
- `backend/seed_changes_complexity.py`

### Frontend (estado absorbido)

- `frontend/src/index.html` (`lang="es"`)
- `frontend/src/styles.css`
- `frontend/src/main.ts`
- `frontend/src/app/app.config.ts`
- `frontend/src/app/app.routes.ts`
- `frontend/src/app/app.component.ts`
- `frontend/src/app/models/interfaces.ts`
- `frontend/src/app/services/api.service.ts`
- `frontend/src/app/services/theme.service.ts`
- `frontend/src/app/components/layout/layout.component.ts`
- `frontend/src/app/components/masters/platforms/platforms.component.ts`
- `frontend/src/app/components/masters/objects/objects.component.ts`
- `frontend/src/app/components/masters/changes/changes.component.ts`
- `frontend/src/app/components/masters/complexity-objects/complexity-objects.component.ts`
- `frontend/src/app/components/masters/complexity-changes/complexity-changes.component.ts`
- `frontend/src/app/components/catalogs/catalogs.component.ts`
- `frontend/src/app/components/catalog-items/catalog-items.component.ts`  
  (incluye vistas, export Cocomo/CSV/Excel, Time en grilla con locale `es`, formulario Editar Time con parámetros, bajas/activaciones)
- `frontend/package.json`
- `frontend/angular.json`

### Scripts y agente

- `scripts/start_all.bat`, `start_backend.bat`, `start_frontend.bat`, `stop_all.bat`
- `scripts/seed_*.bat`
- `scripts/backup_proyecto_github.ps1`
- `.cursor/skills/catalogos-ux-ui/SKILL.md`

**Capacidades ya presentes en el código al momento de la línea base (resumen):**

- ABM de maestros y catálogos
- Alta combinatoria de items con preview y conflictos
- Código por concatenación de siglas
- Time editable (formulario + grilla localizada); exportación CSV/Excel; vistas completa/resumida/BD; baja lógica/definitiva y activación

---

<!-- Próximas versiones: v1.0.1, v1.0.2, ... debajo de esta línea -->
