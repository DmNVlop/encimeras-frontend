"""
Cubre el import CSV de Materials: importa el fixture materials-import-sample.csv (2
materiales), confirma el alert de éxito, que los materiales existen en el backend con sus
campos y que aparecen en la grilla.

Escribe (por UI): 2 materiales «ZZ Prueba Material CSV 1/2» (refs ZZPRUEBA01/02) que borra
por API al terminar (try/finally).

Lanzar: npm run test:demo -- materials factory=DEMO
"""
import pathlib
import sys
from playwright.sync_api import sync_playwright, expect

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / '_lib'))
from factory_env import credentials, admin_token, assert_factory, check, done
from pw_common import launch, login, goto_admin
from test_data import list_materials, cleanup_materials

CSV_FIXTURE = pathlib.Path(__file__).resolve().parent / "fixtures" / "materials-import-sample.csv"

token = admin_token()
assert_factory(token)

try:
    with sync_playwright() as p:
        browser = launch(p)
        page = browser.new_page()
        login(page, *credentials('ADMIN'))
        goto_admin(page, "materials")

        with page.expect_event("dialog") as dialog_info:
            with page.expect_file_chooser() as fc_info:
                page.get_by_role("button", name="Importar materiales desde CSV", exact=True).click()
            fc_info.value.set_files(str(CSV_FIXTURE))
        alert = dialog_info.value
        message = alert.message
        alert.accept()
        check("alert de éxito: 2 materiales importados", "2 materiales importados con" in message, message.encode("ascii", "replace").decode())

        by_ref = {m["ref"]: m for m in list_materials(token)}
        check("API: ZZPRUEBA01 creado con sus campos",
              by_ref.get("ZZPRUEBA01", {}).get("name") == "ZZ Prueba Material CSV 1" and by_ref["ZZPRUEBA01"].get("isActive") is True)
        check("API: ZZPRUEBA02 creado (inactivo)",
              by_ref.get("ZZPRUEBA02", {}).get("name") == "ZZ Prueba Material CSV 2" and by_ref["ZZPRUEBA02"].get("isActive") is False)

        # La grilla muestra los materiales importados (tras recargar)
        page.reload()
        page.wait_for_load_state("networkidle")
        for ref in ("ZZPRUEBA01", "ZZPRUEBA02"):
            try:
                expect(page.get_by_text(ref).first).to_be_visible()
                visible = True
            except AssertionError:
                visible = False
            check(f"{ref} visible en la grilla", visible)

        browser.close()
except Exception as e:
    check('sin excepciones', False, f'{type(e).__name__}: {str(e).splitlines()[0] if str(e) else ""}')
finally:
    remaining = cleanup_materials(token)

check("limpieza: 0 materiales ZZPRUEBA residuales", remaining == 0, f"{remaining} restantes")
done()
