"""
Cubre el export CSV de Users: "Exportar usuarios a CSV" -> modal -> descarga; cabecera con las
columnas esperadas (username, name, email, phone, roles, managerId, ownerId, factoryId...)
y el usuario de prueba exportado con su rol y el factoryId de la fábrica elegida.

Escribe (por API): 1 usuario `zz.prueba.exp1@demo.invalid` (rol USER, contraseña generada
por el backend) que borra al terminar (try/finally). Descarga en users/capturas/.

Lanzar: npm run test:demo -- users factory=DEMO
"""
import csv
import io
import pathlib
import sys
from playwright.sync_api import sync_playwright, expect

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / '_lib'))
from factory_env import credentials, admin_token, assert_factory, api, check, done
from pw_common import launch, login, goto_admin
from test_data import cleanup_users

CAPTURAS = pathlib.Path(__file__).resolve().parent / 'capturas'
CAPTURAS.mkdir(parents=True, exist_ok=True)
DOWNLOAD_PATH = CAPTURAS / '_users-export-downloaded.csv'
USERNAME = 'zz.prueba.exp1@demo.invalid'

token = admin_token()
factory_id = assert_factory(token)

try:
    status, _ = api('POST', '/users', {'username': USERNAME, 'name': 'ZZ Prueba Export', 'email': USERNAME,
                                      'roles': ['USER'], 'generatePassword': True}, token=token)
    check('alta por API del usuario de prueba', status < 300, f'HTTP {status}')

    with sync_playwright() as p:
        browser = launch(p)
        page = browser.new_page()
        login(page, *credentials('ADMIN'))
        goto_admin(page, "users")

        page.get_by_role("button", name="Exportar usuarios a CSV", exact=True).click()
        confirm = page.get_by_role("button", name="Exportar", exact=True)
        expect(confirm).to_be_visible()
        with page.expect_download() as dl_info:
            confirm.click()
        dl_info.value.save_as(DOWNLOAD_PATH)
        browser.close()

    content = DOWNLOAD_PATH.read_text(encoding="utf-8-sig")
    headers = content.splitlines()[0].split(";")
    expected = ["username", "name", "email", "phone", "roles", "managerId", "ownerId", "factoryId"]
    check("cabecera con las columnas de import/export", all(h in headers for h in expected), ";".join(headers))
    rows = list(csv.DictReader(io.StringIO(content), delimiter=";"))
    mine = next((r for r in rows if r.get("username") == USERNAME), None)
    check("el usuario de prueba aparece en el CSV", mine is not None, f"{len(rows)} filas en total")
    if mine:
        check("roles exportados como celda de texto (USER)", mine["roles"] == "USER", mine["roles"])
        check("factoryId exportado = el de la fábrica elegida", mine["factoryId"] == factory_id, mine["factoryId"])
except Exception as e:
    check('sin excepciones', False, f'{type(e).__name__}: {str(e).splitlines()[0] if str(e) else ""}')
finally:
    remaining = cleanup_users(token)

check("limpieza: 0 usuarios zz.prueba. residuales", remaining == 0, f"{remaining} restantes")
done()
