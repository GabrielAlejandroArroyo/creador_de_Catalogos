# Catálogo e Item

## Catálogo

Contenedor con descripción y sigla. Lista en `/catalogs`. Abrís un catálogo para trabajar sus items.

## Item de catálogo

Combinación concreta de Plataforma + Objeto + Cambio + Complejidad Objeto + Complejidad Cambio,
más un **código** generado y un valor **Time**. Puede tener **baja lógica**.

## Código

El backend genera el código pegando siglas:
`plataforma + objeto + cambio + complej_objeto + complej_cambio` (ej. `QRCAB`).
Dentro de un catálogo el código es único. No se edita después de creado.
