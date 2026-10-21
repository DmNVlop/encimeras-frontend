"""
Dashboards con datos reales: portal `/dashboard` (GET /analytics/me) y sección «Actividad de presupuestos»
del admin `/admin/dashboard` (GET /admin/analytics/activity).

Escribe: 1 borrador «ZZ Prueba dashboard UI <marca>» del USER (por API, con quoteTraceId propio) y sus eventos.
En el `finally` se borra el borrador y el ADMIN purga la traza; check de 0 residuos.
La parte de admin se hace con OWNER; si falta DEMO_USER_OWNER, OMITIDO.

Lanzar: npm run test:demo -- dashboard factory=DEMO
"""
import pathlib
import sys
import time
import uuid
from playwright.sync_api import sync_playwright, expect

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / '_lib'))
from factory_env import ENV, BASE, api, login as api_login, credentials, admin_token, assert_factory, check, done
from pw_common import launch, login, goto_admin
from test_data import find_priced_piece
from layout_check import VIEWPORTS, layout_issues

admin = admin_token()
assert_factory(admin)

piece = find_priced_piece(admin)
user_token = api_login(*credentials('USER'))
if not piece:
    print('OMITIDO dashboard — no hay material con receta ENCIMERA y precio configurado')
    done()
if not check('login USER por API', bool(user_token)):
    done()

_, me = api('GET', '/auth/me', token=user_token)
user_name = (me or {}).get('name') or (me or {}).get('username')
trace = str(uuid.uuid4())
name = f'ZZ Prueba dashboard UI {int(time.time())}'
draft_id = None

try:
    status, body = api('POST', '/drafts', {'name': name, 'core': {'mainPieces': [piece], 'factoryId': ENV['FACTORY_ID']}, 'quoteTraceId': trace}, token=user_token)
    draft_id = (body or {}).get('id')
    check('borrador de prueba (API)', status == 201 and bool(draft_id), f'status {status}')

    with sync_playwright() as p:
        browser = launch(p)

        # --- Portal del USER ---
        page = browser.new_page()
        login(page, *credentials('USER'))
        with page.expect_response(lambda r: '/analytics/me' in r.url and r.request.method == 'GET') as resp_info:
            page.goto(f'{BASE}/dashboard')
        check('portal: GET /analytics/me 200', resp_info.value.status == 200, f'status {resp_info.value.status}')
        expect(page.get_by_text('Tus presupuestos y pedidos.', exact=True)).to_be_visible()
        drafts_card = page.get_by_test_id('portal-recent-drafts')
        expect(drafts_card.get_by_text(name, exact=True)).to_be_visible()
        check('portal: el borrador sale en «Últimos borradores»', drafts_card.get_by_text(name, exact=True).count() == 1)
        expect(page.get_by_test_id('quote-funnel')).to_be_visible()
        check('portal USER: sin desglose por usuario', page.get_by_test_id('portal-activity-by-user').count() == 0)
        drafts_card.get_by_text(name, exact=True).click()
        page.wait_for_url('**/drafts')
        check('clic en borrador → /drafts', page.url.endswith('/drafts'), page.url)
        page.close()

        # --- Admin (OWNER) ---
        owner = credentials('OWNER')
        if not owner[0]:
            print('OMITIDO admin — falta DEMO_USER_OWNER')
        else:
            page = browser.new_page()
            login(page, *owner)
            with page.expect_response(lambda r: '/admin/analytics/activity' in r.url and r.request.method == 'GET') as resp_info:
                goto_admin(page, 'dashboard')
            check('admin: GET /admin/analytics/activity 200', resp_info.value.status == 200, f'status {resp_info.value.status}')
            expect(page.get_by_text('Actividad de presupuestos', exact=True)).to_be_visible()
            by_user = page.get_by_test_id('activity-by-user')
            expect(by_user.get_by_text(user_name, exact=True)).to_be_visible()
            check('admin: el USER aparece en «Por usuario»', by_user.get_by_text(user_name, exact=True).count() >= 1, user_name)
            for width, height in VIEWPORTS:
                page.set_viewport_size({'width': width, 'height': height})
                issues = layout_issues(page)
                check(f'admin: layout {width}px sin solapes ni scroll horizontal', not issues, '; '.join(issues))
            # Bajo md el menú lateral es un drawer temporal: se abre con la hamburguesa
            page.get_by_role('button', name='Abrir menú').click()
            expect(page.get_by_role('link', name='Pedidos')).to_be_visible()
            check('admin móvil: la hamburguesa abre el menú', page.get_by_role('link', name='Pedidos').is_visible())
            page.close()

        browser.close()
finally:
    if draft_id:
        api('DELETE', f'/drafts/{draft_id}', token=user_token)
    purge_status, _ = api('DELETE', f'/quote-events/{trace}', token=admin)
    _, left = api('GET', f'/quote-events?quoteTraceId={trace}', token=admin)
    _, drafts_after = api('GET', '/drafts', token=user_token)
    drafts_list = drafts_after if isinstance(drafts_after, list) else (drafts_after or {}).get('data', [])
    leftovers = len(left or []) + len([d for d in drafts_list or [] if d.get('name') == name])
    check('limpieza: 0 residuos (borrador y eventos)', purge_status == 200 and leftovers == 0, f'purga {purge_status}, quedan {leftovers}')

done()
