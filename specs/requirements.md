# Requisitos del Sistema — Creador de Catálogos

> Documento en formato APB (“A Prueba de Burros”): explica el sistema como si fuera la primera vez que alguien lo ve.  
> **Estado documentado:** código existente al **2026-08-08** (línea base `v1.0.0`).  
> No describe ideas futuras: solo lo que el software **ya hace**.

---

## 1. ¿Para qué sirve esto? (propósito de negocio)

Imaginate que una organización necesita armar **listas de códigos** (catálogos).  
Cada código no se inventa a mano: se **arma juntando piezas** que ya existen:

1. Una **Plataforma** (ej. “SQR” con sigla `Q`)
2. Un **Objeto** (ej. “Programa” con sigla `R`)
3. Un **Cambio** (ej. “Cambio” con sigla `C`)
4. Una **Complejidad de Objeto** (ej. “Alta” con sigla `A`)
5. Una **Complejidad de Cambio** (ej. “Baja” con sigla `B`)

El sistema pega las **siglas** y genera un código, por ejemplo:

```text
Q + R + C + A + B  →  QRCAB
```

Ese código vive dentro de un **Catálogo** (una “carpeta” con nombre y sigla propia).  
Además, cada item guarda un valor numérico llamado **Time** (puede tener decimales).

En resumen: **cargar maestros → crear catálogos → generar items con código automático → gestionar Time y bajas**.

---

## 2. ¿Quién usa el sistema?

| Quién | Qué hace |
|------|----------|
| Usuario de gestión (operador / analista) | Carga y mantiene maestros, crea catálogos, da de alta items, edita Time, da de baja o reactiva items, exporta datos. |

**Importante hoy:** no hay login, usuarios ni roles. Quien abre la app en el navegador puede usar todo.

---

## 3. Piezas del negocio (con peras y manzanas)

| Pieza | Qué es | Ejemplo |
|-------|--------|---------|
| **Plataforma** | “Mundo” o sistema al que pertenece el item | SQR (`Q`) |
| **Objeto** | Qué cosa se está midiendo/clasificando | Programa (`R`) |
| **Cambio** | Tipo de cambio asociado | Cambio (`C`) |
| **Complejidad Objeto** | Nivel de complejidad del objeto | Alta (`A`) |
| **Complejidad Cambio** | Nivel de complejidad del cambio | Baja (`B`) |
| **Catálogo** | Contenedor de muchos items | CATALOGO10 |
| **Item de catálogo** | Una combinación concreta + código + Time + baja lógica | `QRCAB`, Time `2,31` |

**Relación especial Objeto ↔ Plataforma:**  
Un Objeto puede estar asociado a **una o más plataformas**.  
La unicidad del objeto no es solo por sigla: es **sigla del objeto + plataforma**.  
Ejemplo: puede existir “Programa / R” en plataforma A y otra vez en plataforma B, pero **no dos veces en la misma plataforma**.

---

## 4. Flujos principales (paso a paso)

### Flujo A — Preparar los maestros

1. Entrar a **Plataformas** y cargar descripción + sigla.
2. Entrar a **Objetos**, cargar descripción + sigla y marcar a qué plataformas aplica.
3. Entrar a **Cambios** y cargar descripción + sigla.
4. Entrar a **Complejidad Objeto** y cargar descripción + sigla.
5. Entrar a **Complejidad Cambio** y cargar descripción + sigla.

Sin estos maestros no se pueden armar items con sentido.

### Flujo B — Crear un catálogo

1. Ir a **Catálogos**.
2. Escribir descripción y sigla.
3. Guardar.
4. Abrir el catálogo (link / ícono de items) para trabajar sus items.

### Flujo C — Dar de alta items en un catálogo

1. Abrir un catálogo → pantalla **Items del Catálogo**.
2. Elegir **Plataforma**.
3. Marcar uno o más **Objetos** (solo los de esa plataforma), o usar **Seleccionar todo** en esa lista.
4. Marcar uno o más **Cambios**, o **Seleccionar todo**.
5. Marcar una o más **Complejidades de Objeto**, o **Seleccionar todo**.
6. Marcar una o más **Complejidades de Cambio**, o **Seleccionar todo**.
7. El sistema muestra un **preview** de todos los códigos que saldrían de combinar esas selecciones.
8. Si algún código **ya existe** en el catálogo, aparece como conflicto; se puede desmarcar / excluir.
9. Confirmar **Agregar Items** → se crean solo los códigos nuevos (sin conflicto).

En cada lista múltiple del alta, **Seleccionar todo** marca todas las opciones visibles; si ya estaban todas marcadas, las desmarca (y limpia los niveles siguientes de la cascada cuando corresponde).

El código lo genera el backend pegando siglas. El frontend no inventa el código final de persistencia.

### Flujo D — Ver items (varias vistas)

En la grilla de items hay modos:

| Vista | Para qué sirve |
|-------|----------------|
| **Vista completa** | Tabla plana; Time editable en grilla; selección para activar/eliminar |
| **Vista resumida** | Árbol jerárquico (Plataforma → Objeto → Cambio → Complej.) + filtros |
| **Vista por plataforma** | Agrupación desplegable solo por plataforma: resumen (items, bajas, time total) y, al expandir, grilla de items con CRUD |
| **Vista base de datos** | Columnas “crudas” (IDs, code, time, baja) solo lectura |
| **Vista base de datos detallada** | IDs + descripciones/siglas de maestros, solo lectura |
| **Extraer datos** | Descarga CSV o Excel con sets de columnas |

### Flujo E — Editar Time

Hay dos caminos:

1. **Formulario “Editar Time”** (lápiz): muestra código y parámetros (Plataforma, Objeto, Cambio, Complejidades) en solo lectura; solo se edita Time.
2. **Vista completa en grilla**: se escribe Time en la celda; si cambió y no se grabó → marca **sin grabar**; si el texto no es un número válido según locale → marca **inválido**.

**Locale:** el sitio está en `lang="es"`. Decimales con **coma** (ej. `2,31`). Al guardar, se convierte a número real para la base de datos.

### Flujo F — Baja y activación

- **Baja lógica:** el item sigue existiendo pero marcado como dado de baja; no se puede editar Time.
- **Baja definitiva:** se borra el registro.
- **Activar:** quita la baja lógica (uno o varios).

Hay acciones individuales y por selección (bulk).

### Flujo G — Extraer datos

1. Ir al tab **Extraer datos**.
2. Elegir set de columnas:
   - **Cocomo Catalog Web** (columnas con nombres en inglés, tipografía tal cual el importador espera)
   - Vista completa / Base de datos / Base de datos detallada
3. Descargar **CSV** o **Excel** (`.xls` XML).

La exportación se hace en el navegador con los items ya cargados (no hay endpoint de export en el backend).

### Flujo H — Asistente IA (ayuda por concepto)

1. En **todas** las pantallas hay un botón flotante **IA** (siempre visible).
2. Al abrirlo, el sistema consulta el estado de la IA.
3. **Sin API key de pago:** usa automáticamente el modelo open source gratis vía **Ollama** (preferencia DeepSeek-R1 / reasoning). Si Ollama no está, responde con **RAG local** (docs de ayuda).
4. Se puede chatear y usar chips de conceptos (Plataforma, Objeto, Cambio, Complejidad, Catálogo, Código, Time, Baja, Exportación).
5. Opcional: ir a **Mantenimiento IA** para cargar API keys cloud u otras conexiones.
6. Modo **Fundacional** = solo LLM; **Fundacional + RAG** = LLM + fragmentos de la base de conocimiento local.

### Flujo I — Mantenimiento IA (1 o N conexiones)

1. Ir a **Mantenimiento IA** (menú lateral o desde el asistente).
2. Botón **Usar modelo open source gratis** (Ollama, sin API key).
3. Alta manual: nombre, base URL, API key (opcional si es local), modelo, modo.
4. Se pueden cargar **varias** conexiones (una por API key cuando aplica).
5. Acciones: editar, probar, activar (solo una activa), eliminar.---

## 5. Reglas de negocio que el sistema ya aplica

1. El **código** de un item = concatenación de siglas de Plataforma + Objeto + Cambio + Complej. Objeto + Complej. Cambio.
2. Dentro de un mismo catálogo, el **código es único**.
3. Al crear un item, `baja_logica = false` y `time` por defecto `0` si no se envía.
4. La **única** edición de item por API es el campo **Time** (no se pueden cambiar las FKs ni el código después de creado).
5. No se edita Time si el item tiene baja lógica.
6. No se puede eliminar un maestro si hay items que lo referencian.
7. Siglas únicas (salvo Objetos, cuya unicidad es por pareja sigla+plataforma).
8. Objeto exige **al menos una plataforma** asociada.

---

## 6. Restricciones estrictas — qué NO hace el sistema hoy

Esta lista es deliberada: si algo no está acá implementado, **no existe**.

1. **No** hay autenticación, login, permisos ni usuarios.
2. **No** hay multi-tenant / empresas / espacios separados.
3. **No** se puede editar el código de un item ya creado.
4. **No** se pueden cambiar Plataforma/Objeto/Cambio/Complejidades de un item existente (solo Time).
5. **No** hay historial de auditoría (quién cambió qué y cuándo).
6. **No** hay importación desde CSV/Excel hacia el sistema (solo exportación).
7. **No** hay API de exportación en el servidor.
8. **No** hay notificaciones, correo ni jobs en segundo plano.
9. **No** hay tests automatizados visibles en el repo como suite formal.
10. **No** se hostea el backend FastAPI en la nube: corre local (`:8000`). El frontend sí se publica en GitHub Pages (UI estática).
11. **No** hay base de datos distinta de SQLite local (`catalog.db`) en la configuración actual.
12. **No** hay búsqueda global / dashboard de métricas.
13. **No** hay “copiar catálogo completo” como función dedicada (aunque existan datos con nombres tipo “Catalogocopia”).
14. **No** valida reglas Cocomo de negocio más allá de armar/exportar columnas con esos nombres.
15. **No** el asistente IA indexa ni consulta items/maestros de la BD de negocio (solo docs de ayuda locales en modo RAG).
16. **No** hay streaming de respuestas del chat ni multi-usuario / permisos sobre conexiones IA.
17. **No** hay autenticación para editar conexiones IA (igual que el resto de la app).
18. **No** descarga ni instala modelos Ollama automáticamente (el usuario debe tener Ollama y hacer `pull` del modelo).

---

## 7. Pantallas que existen hoy

| Ruta | Pantalla |
|------|----------|
| `/platforms` | Maestros Plataformas |
| `/objects` | Maestros Objetos |
| `/changes` | Maestros Cambios |
| `/complexity-objects` | Maestros Complejidad Objeto |
| `/complexity-changes` | Maestros Complejidad Cambio |
| `/catalogs` | Listado / ABM de Catálogos |
| `/catalogs/:catalogId/items` | Items del catálogo (alta, vistas, export, Time) |
| `/ai-settings` | Mantenimiento IA (ABM de conexiones / API keys) |

La app arranca redirigiendo a `/catalogs`. El botón flotante del **Asistente IA** está en todas las pantallas del layout.
---

## 8. Arranque local (para humanos)

- Backend: `http://localhost:8000` (docs en `/docs`)
- Frontend: `http://localhost:4200`
- Script típico: `scripts/start_all.bat` (Windows)

Hay scripts de seed (`seed_platforms`, `seed_objects`, `seed_changes_complexity`) para cargar datos iniciales de maestros.

---

## 9. Publicación en GitHub (qué hace / qué no)

### Qué hace

1. En cada push o PR a `main`, GitHub Actions corre **CI** (backend import + build frontend).
2. Si la versión tope de `specs/changelog.md` (ej. `v1.0.4`) aún no tiene tag, Actions crea el **tag**, un **GitHub Release** con las notas de esa entrada y adjunta el zip del frontend.
3. El frontend se despliega a **GitHub Pages** para ver la UI en el navegador.

### Qué NO hace

1. **No** publica ni ejecuta el backend en GitHub/Pages.
2. **No** crea versiones si el tag ya existe (idempotente).
3. **No** reemplaza el uso local completo: para datos reales seguís necesitando API + SQLite en tu máquina.
