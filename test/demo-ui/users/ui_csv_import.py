"""
Cubre el import CSV de Users con reporte mixto (creados / fallidos / omitidos). Importa el
fixture users-import-sample.csv (3 filas) como ADMIN:
  - fila 1 (USER simple): se crea ("Creados"),
  - fila 2 (email mal formado): el backend la rechaza por @IsEmail -> "Fallidos" con el
    motivo del servidor, no "Omitidos",
  - fila 3 (SALES sin managerId): se omite ANTES de enviar al backend -> "Omitidos".
  - el factoryId dummy del fixture se ignora: el usuario creado queda con el de la fábrica.
  - la contraseña la genera el backend (12 caracteres); el FE descarga un CSV
    username;password y esa contraseña permite hacer login. La respuesta del alta no
    incluye el hash.

Escribe (por UI): 1 usuario `zz.prueba.csv1@demo.invalid`; lo borra por API al terminar
(try/finally). La descarga de credenciales no se guarda en disco por el test.

Lanzar: npm run test:demo -- users factory=DEMO
"""
import pathlib
import sys
from playwright.sync_api import sync_playwright, expect

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / '_lib'))
from factory_env import credentials, admin_token, assert_factory, login as api_login, check, done
from pw_common import launch, login, goto_admin
from test_data import list_users, cleanup_users

CSV_FIXTURE = pathlib.Path(__file__).resolve().parent / "fixtures" / "users-import-sample.csv"
USER_OK = "zz.prueba.csv1@demo.invalid"
USER_BAD_EMAIL = "zz.prueba.bademail@demo.invalid"
USER_SALES = "zz.prueba.sales1@demo.invalid"

token = admin_token()
factory_id = assert_factory(token)

try:
    with sync_playwright() as p:
        browser = launch(p)
        page = browser.new_page()
        login(page, *credentials('ADMIN'))
        goto_admin(page, "users")

        # El FE descarga el CSV de credenciales y luego muestra el alert: se esperan los tres eventos.
        with page.expect_event("dialog") as dialog_info:
            with page.expect_response(lambda r: r.url.endswith("/users") and r.request.method == "POST" and r.ok) as created_info:
                with page.expect_download() as dl_info:
                    with page.expect_file_chooser() as fc_info:
                        page.get_by_role("button", name="Importar usuarios desde CSV", exact=True).click()
                    fc_info.value.set_files(str(CSV_FIXTURE))
        alert = dialog_info.value
        message = alert.message
        alert.accept()

        created_body = created_info.value.json()
        check("la respuesta del alta no incluye el hash", "password" not in created_body)

        credentials_csv = pathlib.Path(dl_info.value.path()).read_text(encoding="utf-8-sig").strip().splitlines()
        check("CSV de credenciales: cabecera username;password y 1 fila", credentials_csv[0] == "username;password" and len(credentials_csv) == 2, credentials_csv[0])
        generated = dict(line.split(";", 1) for line in credentials_csv[1:])
        generated_password = generated.get(USER_OK, "")
        check("contraseña generada de 12 caracteres", len(generated_password) == 12, f"{len(generated_password)} caracteres")

        check("alert: Creados: 1", "Creados: 1" in message, message.encode("ascii", "replace").decode().replace("\n", " | ")[:200])
        check("alert: Fallidos: 1 con el email malformado", "Fallidos: 1" in message and USER_BAD_EMAIL in message)
        check("alert: Omitidos: 1 (SALES sin managerId)", "Omitidos: 1" in message and USER_SALES in message and "managerId" in message)

        page.reload()
        page.wait_for_load_state("networkidle")
        try:
            expect(page.get_by_text(USER_OK).first).to_be_visible()
            visible = True
        except AssertionError:
            visible = False
        check("USER simple visible en la grilla", visible)
        check("email malformado NO creado (grilla)", page.get_by_text(USER_BAD_EMAIL).count() == 0)
        check("SALES sin managerId NO creado (grilla)", page.get_by_text(USER_SALES).count() == 0)

        browser.close()

    # Backend real: factoryId de la fábrica (no el dummy del CSV) y login con la contraseña generada.
    by_username = {u["username"]: u for u in list_users(token)}
    created = by_username.get(USER_OK)
    check("API: usuario creado con el factoryId de la fábrica (no el del CSV)",
          bool(created) and str(created.get("factoryId")) == factory_id, str(created.get("factoryId") if created else "(no encontrado)"))
    check("API: email malformado y SALES sin manager no existen", USER_BAD_EMAIL not in by_username and USER_SALES not in by_username)
    check("login con la contraseña generada", bool(api_login(USER_OK, generated_password)))
except Exception as e:
    check('sin excepciones', False, f'{type(e).__name__}: {str(e).splitlines()[0] if str(e) else ""}')
finally:
    remaining = cleanup_users(token)

check("limpieza: 0 usuarios zz.prueba. residuales", remaining == 0, f"{remaining} restantes")
done()
