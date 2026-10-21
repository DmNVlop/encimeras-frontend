"""
Cubre el export CSV de Materials: botón "Exportar materiales a CSV" -> modal -> descarga; la cabecera
usa el mismo mapeo de columnas que el import (reimportable, igual que la del fixture
materials-import-sample.csv) y el material de prueba sale con sus campos y su receta
de precios como JSON válido.

Escribe (por API): 1 material «ZZ Prueba Material Export» (ref ZZPRUEBA-EXP) que borra al
terminar (try/finally). Descarga en materials/capturas/.

Lanzar: npm run test:demo -- materials factory=DEMO
"""
import csv
import io
import json
import pathlib
import sys
from playwright.sync_api import sync_playwright, expect

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / '_lib'))
from factory_env import credentials, admin_token, assert_factory, check, done
from pw_common import launch, login, goto_admin
from test_data import create_material, cleanup_materials

HERE = pathlib.Path(__file__).resolve().parent
CAPTURAS = HERE / 'capturas'
CAPTURAS.mkdir(parents=True, exist_ok=True)
DOWNLOAD_PATH = CAPTURAS / '_materials-export-downloaded.csv'
FIXTURE = HERE / 'fixtures' / 'materials-import-sample.csv'

token = admin_token()
assert_factory(token)

try:
    create_material(token, 'ZZPRUEBA-EXP', 'ZZ Prueba Material Export')

    with sync_playwright() as p:
        browser = launch(p)
        page = browser.new_page()
        login(page, *credentials('ADMIN'))
        goto_admin(page, "materials")

        # El botón "Exportar materiales a CSV" abre el modal ExportCsvDialog (alcance página/filtrado/todo);
        # hay que confirmar dentro del modal para disparar la descarga real.
        page.get_by_role("button", name="Exportar materiales a CSV", exact=True).click()
        confirm = page.get_by_role("button", name="Exportar", exact=True)
        expect(confirm).to_be_visible()
        with page.expect_download() as dl_info:
            confirm.click()
        dl_info.value.save_as(DOWNLOAD_PATH)
        browser.close()

    content = DOWNLOAD_PATH.read_text(encoding="utf-8-sig")
    rows = list(csv.DictReader(io.StringIO(content), delimiter=";"))
    fixture_headers = FIXTURE.read_text(encoding="utf-8-sig").splitlines()[0].split(";")
    headers = content.splitlines()[0].split(";")
    check("cabecera del CSV = columnas del import (reimportable)", headers == fixture_headers, ";".join(headers))
    mine = next((r for r in rows if r.get("ref") == "ZZPRUEBA-EXP"), None)
    check("el material de prueba aparece en el CSV", mine is not None, f"{len(rows)} filas en total")
    if mine:
        check("campos del material exportados (name, category, type, isActive)",
              mine["name"] == "ZZ Prueba Material Export" and mine["category"] == "HPL" and mine["type"] == "MDF" and mine["isActive"].lower() == "true",
              str({k: mine[k] for k in ("name", "category", "type", "isActive")}))
        try:
            recipes = json.loads(mine["pricingRecipes"])
            ok = recipes[0]["productType"] == "ENCIMERA" and recipes[0]["unit"] == "m2"
        except Exception as e:  # noqa: BLE001
            ok = False
            recipes = str(e)
        check("pricingRecipes exportado como JSON válido (roundtrip)", ok, str(recipes)[:100])
except Exception as e:
    check('sin excepciones', False, f'{type(e).__name__}: {str(e).splitlines()[0] if str(e) else ""}')
finally:
    remaining = cleanup_materials(token)

check("limpieza: 0 materiales ZZPRUEBA residuales", remaining == 0, f"{remaining} restantes")
done()
