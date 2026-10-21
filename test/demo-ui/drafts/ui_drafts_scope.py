"""
Borradores con alcance en el portal `/drafts`: el OWNER ve el borrador del USER de su fábrica como ajeno
(«De <usuario> · se abre como copia», sin botón de borrar). «Abrir como copia» carga el wizard
(`GET /drafts/:id` con `isOwn: false`) sin error y el original queda intacto. Que guardar la copia cree un
borrador nuevo (POST, no PUT) se prueba a mano: recorrer el wizard con una pieza creada por API es frágil.

Escribe: 1 borrador «ZZ Prueba alcance UI <marca>» del USER (por API) y su traza.
En el `finally` se borra y el ADMIN purga la traza; check de 0 residuos.
Si el USER de pruebas no es de la fábrica: OMITIDO.

Lanzar: npm run test:demo -- drafts factory=DEMO
"""
import pathlib
import sys
import time
import uuid
from playwright.sync_api import sync_playwright, expect

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / '_lib'))
from factory_env import ENV, BASE, api, login as api_login, credentials, admin_token, assert_factory, check, done
from pw_common import launch, login
from test_data import find_priced_piece

admin = admin_token()
assert_factory(admin)

piece = find_priced_piece(admin)
user_token = api_login(*credentials('USER'))
owner_token = api_login(*credentials('OWNER'))
if not piece:
    print('OMITIDO borradores con alcance — no hay material con receta ENCIMERA y precio configurado')
    done()
if not check('login USER y OWNER por API', bool(user_token and owner_token)):
    done()
_, me = api('GET', '/auth/me', token=user_token)
if str((me or {}).get('factoryId')) != str(ENV['FACTORY_ID']):
    print('OMITIDO borradores con alcance — el USER de pruebas no es de la fábrica')
    done()

trace = str(uuid.uuid4())
name = f'ZZ Prueba alcance UI {int(time.time())}'
draft_id = None

try:
    status, body = api('POST', '/drafts', {'name': name, 'core': {'mainPieces': [piece], 'factoryId': ENV['FACTORY_ID']}, 'quoteTraceId': trace}, token=user_token)
    draft_id = (body or {}).get('id')
    check('borrador del USER creado (API)', status == 201 and bool(draft_id), f'status {status}')

    with sync_playwright() as p:
        browser = launch(p)
        page = browser.new_page()
        login(page, *credentials('OWNER'))
        page.goto(f'{BASE}/drafts')

        card = page.locator('.MuiCard-root').filter(has_text=name)
        expect(card).to_be_visible(timeout=15000)
        check('tarjeta marcada como ajena', card.get_by_text('se abre como copia').is_visible())
        check('sin botón de borrar en la ajena', card.locator('[data-testid="DeleteOutlineIcon"]').count() == 0)

        open_button = card.get_by_role('button', name='Abrir como copia')
        check('botón «Abrir como copia»', open_button.is_visible())
        with page.expect_response(lambda r: f'/drafts/{draft_id}' in r.url and r.request.method == 'GET') as resp_info:
            open_button.click()
        check('GET del borrador ajeno → 200 con isOwn false', resp_info.value.status == 200 and resp_info.value.json().get('isOwn') is False, str(resp_info.value.status))

        page.wait_for_url(lambda u: '/quote' in u)
        page.wait_for_load_state('networkidle')
        check('el wizard carga la copia sin error', page.get_by_text('El borrador ha caducado o no existe').count() == 0)
        browser.close()

    _, original = api('GET', f'/drafts/{draft_id}', token=user_token)
    check('el borrador del USER sigue intacto', ((original or {}).get('data') or {}).get('name') == name)
finally:
    if draft_id:
        api('DELETE', f'/drafts/{draft_id}', token=user_token)
    api('DELETE', f'/quote-events/{trace}', token=admin)
    _, left = api('GET', '/drafts', token=admin)
    leftovers = len([d for d in left or [] if str(d.get('name', '')).startswith(name)])
    check('limpieza: 0 borradores de prueba', leftovers == 0, f'quedan {leftovers}')

done()
