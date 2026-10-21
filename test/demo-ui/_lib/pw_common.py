"""
Helpers de Playwright para las pruebas del admin contra el FE y el BE en marcha
(URLs de `docs/integrations/<Fábrica>/.env.playwright.local`, vía `factory_env`).

Uso típico:

    from factory_env import credentials, check, done, VISUAL
    from pw_common import launch, login, goto_admin

    with sync_playwright() as p:
        browser = launch(p)
        page = browser.new_page()
        login(page, *credentials('ADMIN'))
        goto_admin(page, "materials")
        ...
"""
from factory_env import BASE, VISUAL

FRONTEND_URL = BASE


def launch(p):
    """Chromium sin ventana; con `visual` se ve en directo y a cámara lenta."""
    return p.chromium.launch(headless=not VISUAL, slow_mo=700 if VISUAL else 0)


def login(page, username: str, password: str):
    """Login via UI. Selectores por label real del form (el form no usa ids).
    Llamando a la API directa, `POST /auth/login` espera `username`, no `email`."""
    page.goto(f"{FRONTEND_URL}/login")
    page.wait_for_load_state("networkidle")
    page.get_by_label("Usuario / Email").fill(username)
    page.get_by_label("Contraseña").fill(password)
    page.get_by_role("button", name="Iniciar Sesión").click()
    page.wait_for_url(lambda u: "/login" not in u)
    page.wait_for_load_state("networkidle")


def goto_admin(page, subpath: str):
    """Navega a una subruta del panel admin, ej. 'materials', 'users'."""
    page.goto(f"{FRONTEND_URL}/admin/{subpath}")
    page.wait_for_load_state("networkidle")


def page_token(page):
    """JWT de la sesión del navegador (`localStorage['auth_token']`)."""
    return page.evaluate("() => localStorage.getItem('auth_token')")


def accept_next_dialog(page, messages=None):
    """Acepta el próximo alert()/confirm() nativo. Si se pasa `messages` (lista), guarda el texto.
    Los alerts pueden traer emojis que la consola de Windows no imprime: se sanea a ascii."""
    def _handler(dialog):
        if messages is not None:
            messages.append(dialog.message)
        print("DIALOG:", dialog.message.encode("ascii", "replace").decode())
        dialog.accept()
    page.once("dialog", _handler)
