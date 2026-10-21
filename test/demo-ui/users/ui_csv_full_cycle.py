"""
Ciclo completo del import/export CSV de Users:
  1) Caja negra, caso correcto: importa 2 usuarios válidos, el alert dice "Creados: 2".
  2) Caja negra, caso incorrecto: importa 4 filas con problemas (username vacío, email
     malformado, sin roles, rol inexistente); NINGUNA se crea y el alert distingue
     Fallidos (rechazados por el backend) de Omitidos (nunca enviados por el frontend).
  3) Caja blanca, contra la API real: los 2 válidos existen con sus campos y el factoryId
     de la fábrica (no el vacío del CSV); ninguno de los inválidos existe.
  4) UsersPage se renderiza sin errores de consola con los usuarios de prueba (grilla y búsqueda).
  5) Limpieza: borra los 2 válidos por API y comprueba que ya no aparecen.

Escribe (por UI): hasta 2 usuarios `zz.prueba.valid1/2@demo.invalid`; en el finally se borra
por API cualquier `zz.prueba.…` (incluido si falló a medias).

Lanzar: npm run test:demo -- users factory=DEMO
"""
import pathlib
import sys
from playwright.sync_api import sync_playwright, expect

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / '_lib'))
from factory_env import credentials, admin_token, assert_factory, api, check, done
from pw_common import launch, login, goto_admin
from test_data import list_users, cleanup_users

FIXTURES_DIR = pathlib.Path(__file__).resolve().parent / "fixtures"
VALID_CSV = FIXTURES_DIR / "users-blackbox-valid.csv"
INVALID_CSV = FIXTURES_DIR / "users-blackbox-invalid.csv"

VALID_USERNAMES = ["zz.prueba.valid1@demo.invalid", "zz.prueba.valid2@demo.invalid"]
INVALID_USERNAMES = [
    "zz.prueba.nousername@demo.invalid",  # nunca se crea con este username (va vacío)
    "zz.prueba.bademail@demo.invalid",
    "zz.prueba.noroles@demo.invalid",
    "zz.prueba.badrole@demo.invalid",
]


def import_csv(page, path):
    """Importa el CSV y devuelve el texto del alert (se espera al alert, que sale al terminar el import)."""
    with page.expect_event("dialog") as dialog_info:
        with page.expect_file_chooser() as fc_info:
            page.get_by_role("button", name="Importar usuarios desde CSV", exact=True).click()
        fc_info.value.set_files(str(path))
    alert = dialog_info.value
    message = alert.message
    alert.accept()
    return message


def shown(text):
    return text.encode("ascii", "replace").decode().replace("\n", " | ")[:200]


def has_count(locator, n):
    try:
        expect(locator).to_have_count(n)
        return True
    except AssertionError:
        return False


token = admin_token()
factory_id = assert_factory(token)

try:
    with sync_playwright() as p:
        browser = launch(p)
        page = browser.new_page()
        login(page, *credentials('ADMIN'))
        goto_admin(page, "users")

        # 1) CAJA NEGRA - caso correcto
        alert_valid = import_csv(page, VALID_CSV)
        check("válido: alert reporta Creados: 2", "Creados: 2" in alert_valid, shown(alert_valid))
        check("válido: alert NO reporta Fallidos", "Fallidos" not in alert_valid)
        check("válido: alert NO reporta Omitidos", "Omitidos" not in alert_valid)

        # 2) CAJA NEGRA - caso incorrecto
        alert_invalid = import_csv(page, INVALID_CSV)
        check("inválido: alert reporta Creados: 0", "Creados: 0" in alert_invalid, shown(alert_invalid))
        check("inválido: Fallidos: 2 (username vacío + email malformado)", "Fallidos: 2" in alert_invalid)
        check("inválido: Omitidos: 2 (sin roles + rol inválido)", "Omitidos: 2" in alert_invalid)
        check("inválido: motivo del fallo por username vacío", "must be longer than" in alert_invalid or "username" in alert_invalid.lower())
        check("inválido: motivo del fallo por email malformado", "email must be an email" in alert_invalid)
        check("inválido: motivo de omisión por sin roles", "sin roles" in alert_invalid)
        check("inválido: motivo de omisión por rol inválido", "fuera de tu alcance" in alert_invalid)

        # 3) CAJA BLANCA - API real
        by_username = {u.get("username"): u for u in list_users(token)}
        created_ids = []
        for uname in VALID_USERNAMES:
            u = by_username.get(uname)
            check(f"API: '{uname}' existe", u is not None)
            if u:
                created_ids.append(u["_id"])
                check(f"API: '{uname}' roles == ['USER']", u.get("roles") == ["USER"], str(u.get("roles")))
                check(f"API: '{uname}' con el factoryId de la fábrica", str(u.get("factoryId")) == factory_id, str(u.get("factoryId")))
        check("API: ningún usuario inválido existe", not any(n in by_username for n in INVALID_USERNAMES))
        all_users = api("GET", "/users", token=token)[1] or []
        check("API: ningún usuario con username vacío", not any((u.get("username") or "") == "" for u in all_users))

        # 4) UsersPage se renderiza sin errores con los datos nuevos
        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        page.reload()
        page.wait_for_load_state("networkidle")
        check("DataGrid de usuarios se renderiza", has_count(page.locator(".MuiDataGrid-root"), 1))
        for uname in VALID_USERNAMES:
            try:
                expect(page.get_by_text(uname).first).to_be_visible()
                visible = True
            except AssertionError:
                visible = False
            check(f"'{uname}' visible en la grilla tras recargar", visible)

        search_box = page.get_by_placeholder("Buscar por nombre, username o email...")
        search_box.fill("zz.prueba.valid")
        rows = page.locator(".MuiDataGrid-row")
        check("búsqueda 'zz.prueba.valid' filtra a 2 filas", has_count(rows, 2), f"{rows.count()} filas")
        search_box.fill("")
        check("sin errores de consola tras recargar + buscar", len(console_errors) == 0, "; ".join(console_errors)[:150])

        browser.close()

    # 5) Limpieza explícita de los válidos, comprobando cada borrado
    for uid in created_ids:
        status, _ = api("DELETE", f"/users/{uid}", token=token)
        check(f"borrado de usuario {uid} correcto", status < 300, f"HTTP {status}")
    check("tras borrar, no quedan los usuarios válidos", not any(u["username"] in VALID_USERNAMES for u in list_users(token)))
except Exception as e:
    check('sin excepciones', False, f'{type(e).__name__}: {str(e).splitlines()[0] if str(e) else ""}')
finally:
    remaining = cleanup_users(token)

check("limpieza: 0 usuarios zz.prueba. residuales", remaining == 0, f"{remaining} restantes")
done()
