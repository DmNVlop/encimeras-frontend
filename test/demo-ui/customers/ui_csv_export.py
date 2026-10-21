"""
Cubre el export CSV de Customers (modal ExportCsvDialog): conteos del modal sin filtro y
con búsqueda, descarga con alcance "filtrado" (headers y nº de filas) y selector de
columnas (deseleccionar "nif" la excluye del CSV).

Escribe (por API, en la fábrica elegida): 2 clientes «ZZ Prueba Export …» que borra al
terminar (try/finally). Descarga en customers/capturas/.

Lanzar: npm run test:demo -- customers factory=DEMO
"""
import pathlib
import re
import sys
from playwright.sync_api import sync_playwright, expect

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / '_lib'))
from factory_env import credentials, admin_token, assert_factory, check, done
from pw_common import launch, login, goto_admin
from test_data import create_customer, cleanup_customers

CAPTURAS = pathlib.Path(__file__).resolve().parent / 'capturas'
CAPTURAS.mkdir(parents=True, exist_ok=True)
DOWNLOAD_PATH = CAPTURAS / '_customers-export-downloaded.csv'

token = admin_token()
assert_factory(token)

try:
    create_customer(token, 'ZZ Prueba Export Uno', 'ZZPRUEBA-EXP1')
    create_customer(token, 'ZZ Prueba Export Dos', 'ZZPRUEBA-EXP2')

    with sync_playwright() as p:
        browser = launch(p)
        page = browser.new_page()
        login(page, *credentials('ADMIN'))
        goto_admin(page, "customers")
        dialog = page.locator(".MuiDialogContent-root")

        # --- Sin filtro: el modal ofrece "Todas las páginas" y el total incluye nuestros 2 clientes ---
        page.get_by_role("button", name="Exportar clientes a CSV", exact=True).click()
        expect(dialog).to_contain_text("Todo el listado")
        text_no_filter = dialog.inner_text()
        total = re.search(r"Todo el listado, sin filtros \((\d+) filas\)", text_no_filter)
        check("modal sin filtro: total >= 2 (incluye los clientes de prueba)", bool(total) and int(total.group(1)) >= 2,
              text_no_filter.replace("\n", " | ")[:120])
        check("modal sin filtro: sin 'Filtro activo'", "Filtro activo" not in text_no_filter)
        page.get_by_role("button", name="Cancelar").click()
        expect(dialog).to_be_hidden()

        # --- Búsqueda: solo los 2 clientes de prueba ---
        page.get_by_placeholder("Buscar cliente...").fill("ZZ Prueba Export")
        expect(page.get_by_text("ZZ Prueba Export Uno").first).to_be_visible()

        page.get_by_role("button", name="Exportar clientes a CSV", exact=True).click()
        expect(dialog).to_contain_text("Resultado filtrado")
        expect(dialog).to_contain_text("(2 filas)")
        text_filtered = dialog.inner_text()
        check("modal con búsqueda: 'Resultado filtrado' con 2 filas",
              "Resultado filtrado, todas las páginas (2 filas)" in text_filtered, text_filtered.replace("\n", " | ")[:160])
        check("modal con búsqueda: muestra el filtro activo", "ZZ Prueba Export" in text_filtered)

        with page.expect_download() as dl_info:
            page.get_by_role("button", name="Exportar", exact=True).click()
        dl_info.value.save_as(DOWNLOAD_PATH)
        lines = DOWNLOAD_PATH.read_text(encoding="utf-8-sig").splitlines()
        headers = lines[0].split(";")
        check("CSV filtrado: cabecera con officialName y nif", "officialName" in headers and "nif" in headers, lines[0][:100])
        check("CSV filtrado: 2 filas de datos", len(lines) - 1 == 2, f"{len(lines) - 1} filas")
        check("CSV filtrado: todas las filas son de prueba", all("ZZ Prueba Export" in l for l in lines[1:]))

        # --- 3b: selector de columnas — deseleccionar "nif" la excluye del CSV ---
        page.get_by_role("button", name="Exportar clientes a CSV", exact=True).click()
        expect(dialog).to_be_visible()
        nif_box = page.get_by_role("checkbox", name="nif", exact=True)
        nif_box.uncheck()
        expect(nif_box).not_to_be_checked()
        with page.expect_download() as dl_info2:
            page.get_by_role("button", name="Exportar", exact=True).click()
        dl_info2.value.save_as(DOWNLOAD_PATH)
        headers2 = DOWNLOAD_PATH.read_text(encoding="utf-8-sig").splitlines()[0].split(";")
        check("CSV sin 'nif': la columna se excluye", "nif" not in headers2 and "officialName" in headers2, ";".join(headers2)[:100])

        browser.close()
except Exception as e:
    check('sin excepciones', False, f'{type(e).__name__}: {str(e).splitlines()[0] if str(e) else ""}')
finally:
    remaining = cleanup_customers(token)

check("limpieza: 0 clientes «ZZ Prueba» residuales", remaining == 0, f"{remaining} activos")
done()
