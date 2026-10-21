"""
Cubre el preview del import CSV de Customers (ImportCsvPreviewDialog): clasificación
crear/actualizar por key "nif" (default), recálculo al cambiar la key a "Nombre oficial"
y que cancelar NO toca el backend.

Escribe (por API): 1 cliente «ZZ Prueba Import Existente» (nif ZZPRUEBA-IMP1) que el
fixture customers-import-sample.csv actualizaría; el preview no escribe nada. Se borra
al terminar (try/finally).

Lanzar: npm run test:demo -- customers factory=DEMO
"""
import pathlib
import sys
from playwright.sync_api import sync_playwright, expect

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / '_lib'))
from factory_env import credentials, admin_token, assert_factory, check, done
from pw_common import launch, login, goto_admin
from test_data import create_customer, cleanup_customers, list_customers

FIXTURE_PATH = pathlib.Path(__file__).resolve().parent / "fixtures" / "customers-import-sample.csv"
ORIGINAL_DESCRIPTION = "Descripción original de prueba"


def ascii_(text):
    return text.encode("ascii", "replace").decode().replace("\n", " | ")[:160]


token = admin_token()
assert_factory(token)

try:
    create_customer(token, "ZZ Prueba Import Existente", "ZZPRUEBA-IMP1", ORIGINAL_DESCRIPTION)

    with sync_playwright() as p:
        browser = launch(p)
        page = browser.new_page()
        login(page, *credentials('ADMIN'))
        goto_admin(page, "customers")
        dialog = page.locator(".MuiDialogContent-root")

        with page.expect_file_chooser() as fc_info:
            page.get_by_role("button", name="Importar clientes desde CSV", exact=True).click()
        fc_info.value.set_files(str(FIXTURE_PATH))
        expect(dialog).to_contain_text("a crear")

        text = dialog.inner_text()
        check("preview key=nif: 1 fila a crear (nif nuevo)", "1 a crear" in text, ascii_(text))
        check("preview key=nif: 1 fila a actualizar (nif existente)", "1 a actualizar" in text)

        # (el Select de MUI no vincula aria-labelledby al InputLabel -> localizar por texto actual "NIF/CIF")
        page.get_by_role("combobox").filter(has_text="NIF/CIF").click()
        page.get_by_role("option", name="Nombre oficial").click()
        expect(page.get_by_role("combobox").filter(has_text="Nombre oficial")).to_be_visible()

        text2 = dialog.inner_text()
        check("preview key=officialName: 1 crear / 1 actualizar tras recalcular",
              "1 a crear" in text2 and "1 a actualizar" in text2, ascii_(text2))

        page.get_by_role("button", name="Cancelar").click()
        expect(dialog).to_be_hidden()

        mine = {c.get("nif"): c for c in list_customers(token)}
        check("cancelar no crea el cliente nuevo (ZZPRUEBA-IMP2)", "ZZPRUEBA-IMP2" not in mine)
        check("cancelar no modifica el existente",
              mine.get("ZZPRUEBA-IMP1", {}).get("description") == ORIGINAL_DESCRIPTION,
              str(mine.get("ZZPRUEBA-IMP1", {}).get("description")))

        browser.close()
except Exception as e:
    check('sin excepciones', False, f'{type(e).__name__}: {str(e).splitlines()[0] if str(e) else ""}')
finally:
    remaining = cleanup_customers(token)

check("limpieza: 0 clientes «ZZ Prueba» residuales", remaining == 0, f"{remaining} activos")
done()
