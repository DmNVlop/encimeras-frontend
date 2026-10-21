"""
Cubre la ejecución real del import CSV de Customers: preview (1 actualizar + 1 crear) ->
"Confirmar importación" -> snackbar de éxito y, contra el backend, el cliente existente
queda con description "Actualizado via CSV" y el nuevo se crea.

Escribe: por API, 1 cliente «ZZ Prueba Import Existente» (nif ZZPRUEBA-IMP1); por UI, el
import crea «ZZ Prueba Import Nuevo SA» (nif ZZPRUEBA-IMP2). Todo «ZZ Prueba» se borra al
terminar (try/finally).

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

token = admin_token()
assert_factory(token)

try:
    existing = create_customer(token, "ZZ Prueba Import Existente", "ZZPRUEBA-IMP1", "Descripción original de prueba")

    with sync_playwright() as p:
        browser = launch(p)
        page = browser.new_page()
        login(page, *credentials('ADMIN'))
        goto_admin(page, "customers")

        with page.expect_file_chooser() as fc_info:
            page.get_by_role("button", name="Importar clientes desde CSV", exact=True).click()
        fc_info.value.set_files(str(FIXTURE_PATH))
        expect(page.locator(".MuiDialogContent-root")).to_contain_text("a actualizar")

        page.get_by_role("button", name="Confirmar importación", exact=False).click()
        snackbar = page.locator(".MuiAlert-message")
        expect(snackbar).to_contain_text("Importación")
        text = snackbar.inner_text()
        check("snackbar: importación completa de 2 clientes", "Importación completa: 2" in text,
              text.encode("ascii", "replace").decode())

        mine = {c.get("nif"): c for c in list_customers(token)}
        updated = mine.get("ZZPRUEBA-IMP1")
        check("el cliente existente se actualizó (mismo _id, description del CSV)",
              bool(updated) and updated["_id"] == existing["_id"] and updated.get("description") == "Actualizado via CSV",
              str(updated.get("description") if updated else "(no encontrado)"))
        created = mine.get("ZZPRUEBA-IMP2")
        check("el cliente nuevo se creó (nif ZZPRUEBA-IMP2)",
              bool(created) and created.get("officialName") == "ZZ Prueba Import Nuevo SA")

        browser.close()
except Exception as e:
    check('sin excepciones', False, f'{type(e).__name__}: {str(e).splitlines()[0] if str(e) else ""}')
finally:
    remaining = cleanup_customers(token)

check("limpieza: 0 clientes «ZZ Prueba» residuales", remaining == 0, f"{remaining} activos")
done()
