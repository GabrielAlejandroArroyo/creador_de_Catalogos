# Time, bajas y exportación

## Time

Valor numérico del item. Locale `es`: decimales con coma (ej. `2,31`).
Se edita en grilla o en el formulario “Editar Time”. No se edita si hay baja lógica.
La única edición de item por API es Time (no cambian FKs ni código).

## Baja lógica vs definitiva

- **Baja lógica:** el item sigue existiendo marcado como dado de baja.
- **Baja definitiva:** se borra el registro.
- **Activar:** quita la baja lógica.

## Exportación

Tab **Extraer datos**: CSV o Excel en el navegador (sets Cocomo Catalog Web, vista completa, BD, BD detallada).
No hay endpoint de export en el backend.
