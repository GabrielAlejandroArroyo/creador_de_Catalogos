# Creador de Catálogos

App local (Angular + FastAPI) para armar catálogos de códigos a partir de maestros.

## Enlaces públicos

| Qué | URL |
|-----|-----|
| **Repositorio** | https://github.com/GabrielAlejandroArroyo/creador_de_Catalogos |
| **UI (GitHub Pages)** | https://gabrielalejandroarroyo.github.io/creador_de_Catalogos/ |
| **Actions (CI/CD)** | https://github.com/GabrielAlejandroArroyo/creador_de_Catalogos/actions |
| **Releases** | https://github.com/GabrielAlejandroArroyo/creador_de_Catalogos/releases |
| **Specs** | [specs/README.md](./specs/README.md) |

> Pages sirve solo el frontend. El backend sigue en `http://localhost:8000` (no se hostea en GitHub).

## Arranque local

- Backend: `http://localhost:8000` (docs en `/docs`)
- Frontend: `http://localhost:4200`
- Windows: `scripts/start_all.bat`

## Versionado

La versión de producto es la entrada tope de [`specs/changelog.md`](./specs/changelog.md).  
Al pushear a `main`, si ese tag aún no existe, Actions crea el Release automáticamente.
