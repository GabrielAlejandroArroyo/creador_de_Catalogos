---
name: catalogos-ux-ui
description: >-
  UX/UI y responsive para Creador de Catálogos (Angular). Usar al diseñar,
  rediseñar o ajustar pantallas, layout, formularios, tablas, jerarquías de
  códigos, modales o componentes visuales del frontend.
---

# UX/UI — Creador de Catálogos

## Cuándo aplicar

- Cambios visuales o de layout en `frontend/`
- Pedidos de responsive, “usar toda la pantalla”, mejora de UX/UI
- Nuevas pantallas o refactors de formularios/tablas/árboles

## Principios

1. **Pantalla completa**: el contenido usa el ancho disponible (`width: 100%`). Evitar `max-width` rígidos en `.page` salvo contenedores muy estrechos (modales). El área main del shell (`main-inner`) ocupa todo el espacio restante junto al sidebar.
2. **Mobile-first fluido**: preferir `clamp()`, `minmax()`, `auto-fit`/`auto-fill` y `min(100%, Npx)` antes de media queries fijas.
3. **Una tarea por zona**: formulario de alta, preview de códigos e items listados son bloques claros.
4. **Feedback inmediato**: conflictos, exclusiones, selección y estados vacíos deben verse sin buscar.
5. **Accesibilidad básica**: `:focus-visible`, labels, `aria-*` en menú/navegación, contraste legible.
6. **Consistencia**: reutilizar tokens y clases de [`frontend/src/styles.css`](frontend/src/styles.css).

## Tokens y clases globales

Definidos en `frontend/src/styles.css`:

| Token / clase | Uso |
|---|---|
| `--color-*`, `--space-page`, `--sidebar-width` | Tema (claro/oscuro vía `data-theme`) y espaciado |
| `.page` | Contenedor de pantalla (full width) |
| `.card` | Bloque de contenido |
| `.form-row`, `.input`, `.select`, `.btn*` | Formularios y acciones |
| `.table-wrap` + `.table` | Tablas con scroll horizontal |
| `.multi-grid` | Grillas de selección múltiple |
| `.badge`, `.error`, `.success`, `.muted` | Estados y metadatos |

## Shell

- Layout en [`layout.component.ts`](frontend/src/app/components/layout/layout.component.ts)
- Desktop: sidebar fija + main fluido a todo el ancho restante
- `<960px`: topbar con hamburguesa + drawer + backdrop; cerrar con navegación, backdrop o Escape
- Tema claro/oscuro: toggle en sidebar (desktop) y topbar (móvil); persistido en `localStorage`

## Breakpoints del proyecto

| Ancho | Comportamiento |
|---|---|
| `<720px` | Inputs/botones a ancho completo; acciones apiladas |
| `<960px` | Navegación drawer (hamburguesa) |

## Patrones de pantalla

### Maestros / Catálogos
- Formulario arriba (`.card` + `.form-row`)
- Tabla abajo dentro de `.table-wrap`
- Acciones de fila con `.actions-cell` (`white-space: nowrap`)

### Items de catálogo
- Cascada de visibilidad: Plataforma → Objeto → Cambio → Complejidades
- Preview jerárquico colapsable; conflictos excluibles por checkbox
- Tabla de items con scroll horizontal (`min-width` alto)

## Checklist antes de cerrar un cambio UI

- [ ] Se ve bien en ~360px, ~768px y ≥1280px
- [ ] No hay scroll horizontal de página (solo tablas/áreas internas)
- [ ] Botones/controles no se cortan ni se solapan
- [ ] Estados vacíos, error y éxito son visibles
- [ ] Se reutilizan tokens/clases globales; no inventar otra paleta
- [ ] `lang="es"` y título de app coherentes en `index.html`

## Anti-patrones

- Volver a poner `.page { max-width: 800px }` (desaprovecha pantalla)
- Duplicar todo el sistema de botones/inputs en cada componente
- Sidebars fijas sin alternativa móvil
- Tablas anchas sin `.table-wrap`
- Depender solo de emojis para acciones críticas (mantener `title`/`aria-label`)
