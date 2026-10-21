# Recetario de pruebas UI (`frontend/test/demo-ui/`)

**Léelo antes de escribir un test de FE.** Aquí está lo que ya se sabe (selectores, recetas de API y trampas) para no volver a rastrear el código. **Se actualiza en la misma tarea** en que un test nuevo descubre una pantalla, un endpoint o una trampa. Si algo de aquí ya no es cierto, se corrige aquí.

Cómo se lanza y cómo se añade un test: `README.md`.

## 1. Esqueleto de un test

1. `sys.path` con `_lib`; de `factory_env`: `credentials`, `admin_token`, `assert_factory`, `api`, `check`, `done`; de `pw_common`: `launch`, `login`, `goto_admin`, `page_token`.
2. `assert_factory(admin_token())`: seguro duro de fábrica.
3. Precondiciones y datos de prueba por API, con prefijo «ZZ Prueba» / `zz.prueba.`.
4. Playwright: `browser = launch(p)` y `login(page, *credentials('ADMIN'))`.
5. `check(...)` por comprobación; limpieza en `finally` y check de 0 residuos; `done()`.

## 2. Recetas de API

| Qué | Cómo | Notas |
|---|---|---|
| Login | `POST /auth/login {username, password}` → `access_token` | El form dice «Usuario / Email», pero el body usa `username`, no `email` |
| Fábrica del token | `GET /auth/me` → `factoryId` | Base del seguro duro |
| Token desde el navegador | `page_token(page)` = `localStorage['auth_token']` | No `token` ni `accessToken` (`frontend/src/utils/token.storage.ts`) |
| Borrado masivo | `DELETE /<recurso>` o `/<recurso>/batch` con ids en el body | Patrón `remove()` de `api.service.ts`; para limpiar, mejor API que UI |
| Respuestas | Sin envoltorio `{data}` | No hay interceptor global que envuelva |
| Pieza con precio real | `GET /materials` (receta `ENCIMERA`) + `GET /price-configs` cuya `combinationKey` (`A:x\|\|B:y`) tenga las mismas claves que `pricingAttributes` | Sin precio para la combinación, `/quotes/calculate` da 404. Helper en `quote-events/ui_pdf_trace.py` |
| Eventos de trazabilidad | `GET /quote-events?quoteTraceId=` (cronología); limpieza `DELETE /quote-events/:quoteTraceId` (solo ADMIN, 409 si llegó a orden) | Se escriben sin bloquear: con API, esperar al evento por polling |

## 3. Pantallas y selectores

| Pantalla | Ruta | Selectores |
|---|---|---|
| Login | `/login` | `get_by_label("Usuario / Email")`, `get_by_label("Contraseña")`, botón «Iniciar Sesión» |
| Admin | `/admin/<módulo>` (`materials`, `customers`, `users`…) | DataGrid MUI: acciones de fila (`GridActionsCellItem`) son `IconButton` con `aria-label` ⇒ `get_by_label()`, no `get_by_role(name=…)` |
| Carrito | `/cart` (portal, cualquier rol) | Ítem por `get_by_role("heading", name=<customName>, exact=True)`: con `get_by_text` hay 3 coincidencias (tarjeta `h6`, resumen y menú `#menu-cart`) y salta el strict mode; «Editar» abre el wizard; PDF: `get_by_text("Descargar resumen PDF")` (es un `<a>` de react-pdf con un `Button component="span"`; antes dice «Preparando documento...») |
| Filtro de columna DataGrid | menú de columna → «Filtro» → input «Valor de filtro» | Helper `_lib/apply_column_filter.py` |

## 4. Trampas conocidas

- **Nada de datos reales ni IDs fijos**: cada test crea los suyos y los limpia en `finally`.
- **Sin esperas fijas** (`wait_for_timeout`, `sleep`): espera al elemento con `expect(...)` o a la respuesta con `expect_response`.
- **Comprobaciones de verdad**: nunca `check(..., True)`.
- `fill()` no dispara eventos de teclado: usa `type()`/`press()` si el campo escucha teclado.
- Alerts nativos con emojis: la consola de Windows no los imprime; `accept_next_dialog` sanea a ascii y el lanzador fuerza `PYTHONIOENCODING=utf-8`.
- MUI oculta el selector «filas por página» si `pageSizeOptions` acaba con una sola opción: `getPageSizeOptions()` (`frontend/src/utils/dataGrid.util.ts`) garantiza ≥ 2. Si el selector «no aparece» con pocos datos, sospechar de esto primero.
- `class-validator`: `@IsOptional` no exime `""`; un CSV con celdas vacías enviadas como `""` da 400 en `@IsEmail`/`@IsUrl`.
- Descargas: `with page.expect_download():` y guardar en `<grupo>/capturas/`.
- **Botones de icono con Tooltip** (import/export CSV del admin): su nombre accesible es el `title` del Tooltip — `get_by_role("button", name="Importar usuarios desde CSV", exact=True)`, `"Exportar clientes a CSV"`, `"Exportar materiales a CSV"`… Siempre `exact=True`: «Exportar CSV» sin exact coincide con la ayuda «Ayuda: cómo importar/exportar CSV» y abre el popover equivocado.
- **Filtro de columna del DataGrid** (v8): el valor se aplica con debounce; si se cierra el panel antes, el filtro se pierde. Señal de aplicado: el botón «Mostrar filtros» aparece en la cabecera de la columna (solo existe con filtro activo). Ya lo espera `_lib/apply_column_filter.py`.
- **Selección en CustomersPage** (cards, sin DataGrid): clic = seleccionar uno, Ctrl+clic = añadir. Esperar el chip «N cliente(s) seleccionado(s)» antes de pulsar «Eliminar clientes seleccionados» (nombre del Tooltip) y el texto «¿Estás seguro de que quieres eliminar» del diálogo antes de confirmar.
- **NIF en el formulario de cliente** (`CustomerDrawer`): el FE exige `^[A-Z0-9]{9}$`; si no, «Formato de NIF/CIF/DNI inválido» y «Guardar» no envía nada. Datos de prueba por UI: `ZZPRDEL01`…; por API no se valida.
