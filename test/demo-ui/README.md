# Pruebas visuales (`frontend/test/demo-ui/`)

Pruebas de regresión con **Playwright en Python**. Se lanzan por grupos contra el frontend (`localhost:80`) y el backend (`localhost:3000`) **ya en marcha**, en la **fábrica que se indique** (`factory=`, obligatoria; la de pruebas es **DEMO**).

Cada test solo toca datos con prefijo **«ZZ Prueba» / `zz.prueba.`** y los borra en un `finally`: la BD no queda con residuos. Antes de cada clic que borra hay un seguro duro (la fila exacta de prueba).

## Cómo se lanzan

```
cd frontend
npm run test:demo                                 # lista los grupos
npm run test:demo -- users factory=DEMO           # un grupo
npm run test:demo -- users customers factory=DEMO # varios
npm run test:demo -- all factory=DEMO             # todos
npm run test:demo -- users factory=DEMO visual    # verlo en directo (ventana + cámara lenta)
```

- **Mismo comando que la batería de API** (`cd backend && npm run test:demo -- <grupo> factory=DEMO`). Por debajo es `python test/demo-ui/run.py` con los mismos argumentos.
- **Fábrica obligatoria**, sin valor por defecto. Antes de lanzar nada se hace login con `DEMO_USER_ADMIN` y se comprueba con `GET /auth/me` que su `factoryId` es `FACTORY_ID` del `.env`; si no, `ABORTO`.
- **Requisitos:** `pip install playwright` + `playwright install chromium`.
- **Credenciales:** `docs/integrations/<Fábrica>/.env.playwright.local`, fuera de git; claves en el README de `backend/test/demo/`.
- **Capturas y descargas:** `<grupo>/capturas/`, fuera de git.
- **Resultado:** cada comprobación imprime `OK`/`FALLO`; resumen final. Sale con código 1 si algún test falla (código ≠ 0 o línea `FALLO`/`ABORTO`).

## Grupos

| Grupo | Test | Qué cubre |
|---|---|---|
| `customers` | `ui_csv_export.py` | Export CSV de Customers: `ExportCsvDialog` con conteos página/filtrado/todo y selector de columnas (todas por defecto); descarga con cabeceras correctas; deseleccionar una columna la excluye |
| | `ui_csv_import_preview.py` | Preview del import CSV (`classifyCustomerImportRows` + `ImportCsvPreviewDialog`): conteos crear/actualizar por key `nif`, recálculo al cambiar a `officialName`, «Cancelar» no ejecuta nada |
| | `ui_csv_import_execute.py` | Import CSV real: la fila «actualizar» modifica el cliente de prueba y la fila «crear» da de alta otro (campos vacíos no se envían como `""`) |
| | `ui_delete.py` | Borrado individual desde la barra de selección y borrado en lote (orden de rutas `batch` antes de `:id`) |
| | `ui_pagination.py` | `TablePagination` con `getPageSizeOptions`: el selector de filas por página se ve aunque haya pocas filas |
| `materials` | `ui_csv_import.py` | Import CSV de Materials (CRLF/BOM/comillas, mapeo único de columnas, `pricingRecipes` JSON en celda) |
| | `ui_csv_export.py` | Export CSV de Materials por `ExportCsvDialog` (sin selector de columnas), cabeceras y formato |
| | `ui_export_csv_dialog.py` | `ExportCsvDialog` compartido: sin filtro los 3 conteos = total; con filtro de columna «Página» y «Filtrado» se achican y «Todo» no |
| `quote-events` | `ui_pdf_trace.py` | Trazabilidad: clic en «Descargar resumen PDF» del carrito → `POST /quote-events/pdf-download {source: "cart"}` (sin ids) → 1 evento PDF_DOWNLOADED enlazado al `quoteTraceId` y `cartItemId` del ítem; limpieza con purga ADMIN. `OMITIDO` si el carrito del USER no está vacío |
| `users` | `ui_csv_export.py` | Export CSV de Users: modal + cabeceras `username;name;email;phone;roles;managerId;ownerId;factoryId;createdAt;createdBy` |
| | `ui_csv_import.py` | Import CSV de Users: scope de roles por importador, contraseña aleatoria del BE, CSV de credenciales descargado y login con ella, informe Creados / Fallidos / Omitidos, `factoryId` del CSV ignorado |
| | `ui_csv_full_cycle.py` | Ciclo caja negra + caja blanca: 2 filas válidas creadas; 4 inválidas (2 fallidas en BE, 2 omitidas en FE) con su motivo; comprobación por `GET /users`; búsqueda en la grilla; limpieza con 0 residuos |

El detalle de qué datos escribe cada test está en su docstring.

## Cómo añadir un test

0. **Primero `RECETAS.md`** (selectores, trampas y recetas de API ya conocidas). Lo nuevo que descubras se añade allí en la misma tarea.
1. Créalo en su grupo con el nombre `ui_<algo>.py` (lo que empieza por `_` es utilidad). Fixtures en `<grupo>/fixtures/`.
2. `_lib/factory_env.py` da `ENV`, `BASE`, `api`, `login`, `credentials(rol)`, `admin_token()`, `assert_factory()`, `check()` y `done()`; `_lib/pw_common.py` da `launch`, `login`, `goto_admin`, `page_token` y `accept_next_dialog`; `_lib/test_data.py`, altas y limpiezas por API de clientes, materiales y usuarios de prueba (devuelven los residuos que quedan).
3. `assert_factory(admin_token())` antes de escribir nada.
4. Espera al elemento, nunca con esperas fijas.
5. `check(nombre, condición real, info)` por comprobación y `done()` al final.
6. Añádelo a la tabla de arriba.
