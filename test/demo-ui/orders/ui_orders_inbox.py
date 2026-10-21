"""
Rediseño de pedidos del backoffice: bandeja `/admin/orders` (GET /orders/search) y ficha `/admin/orders/:id`.

Con OWNER: busca la orden de prueba en la bandeja, la pasa a «Revisado» con la acción rápida de la fila, abre la ficha,
aprueba, deshace (nota obligatoria), rechaza (el botón no confirma sin motivo) y ve el motivo en el seguimiento;
enlace antiguo `?orderId=` redirige a la ficha; layout sin solapes ni scroll horizontal a 1440/1024/768/390 en ambas.
Con WORKER (si hay `DEMO_USER_WORKER`): tras el login cae en la bandeja y el menú muestra «Pedidos».

Escribe: 1 orden «ZZ Prueba bandeja UI <marca>» del USER (por API, desde un borrador propio).
En el `finally` la purga ADMIN (`DELETE /orders/:id`) la borra con su borrador y su traza; check de 0 residuos.

Lanzar: npm run test:demo -- orders factory=DEMO
"""
import pathlib
import re
import sys
from playwright.sync_api import sync_playwright, expect

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / '_lib'))
from factory_env import ENV, BASE, api, login as api_login, credentials, admin_token, assert_factory, check, done
from pw_common import launch, login, goto_admin
from test_data import find_priced_piece, create_test_order, purge_test_order
from layout_check import VIEWPORTS, layout_issues

admin = admin_token()
assert_factory(admin)

owner = credentials('OWNER')
piece = find_priced_piece(admin)
user_token = api_login(*credentials('USER'))
if not owner[0]:
    print('OMITIDO orders — falta DEMO_USER_OWNER')
    done()
if not piece:
    print('OMITIDO orders — no hay material con receta ENCIMERA y precio configurado')
    done()
if not check('login USER por API', bool(user_token)):
    done()

created = {}


def is_status_change(resp, order_id, path='/status'):
    return f'/orders/{order_id}{path}' in resp.url and resp.request.method in ('PATCH', 'POST')


def check_layout(page, label):
    for width, height in VIEWPORTS:
        page.set_viewport_size({'width': width, 'height': height})
        issues = layout_issues(page)
        check(f'{label}: layout {width}px sin solapes ni scroll horizontal', not issues, '; '.join(issues))
    page.set_viewport_size({'width': 1440, 'height': 900})


try:
    created = create_test_order(user_token, piece, ENV['FACTORY_ID'], 'bandeja UI')
    order_id, name = created['orderId'], created['name']
    if not check('orden de prueba (API)', bool(order_id), created.get('error') or ''):
        raise SystemExit

    with sync_playwright() as p:
        browser = launch(p)
        page = browser.new_page(viewport={'width': 1440, 'height': 900})
        login(page, *owner)

        # --- Bandeja: búsqueda y acción rápida ---
        with page.expect_response(lambda r: '/orders/search' in r.url and 'q=' in r.url and r.request.method == 'GET') as resp_info:
            page.goto(f'{BASE}/admin/orders?q={name.replace(" ", "+")}')
        check('bandeja: GET /orders/search 200', resp_info.value.status == 200, f'status {resp_info.value.status}')
        row = page.locator('.MuiDataGrid-row', has_text=name)
        expect(row).to_be_visible()
        check('bandeja: la orden sale buscando por nombre', row.count() == 1)
        expect(page.get_by_test_id('inbox-tab-active')).to_contain_text('(1)')
        check('bandeja: contador «En curso» = 1 con la búsqueda', '(1)' in page.get_by_test_id('inbox-tab-active').inner_text())

        quick = page.get_by_test_id(f'inbox-action-{order_id}')
        expect(quick).to_have_text('Marcar revisado')
        with page.expect_response(lambda r: is_status_change(r, order_id)) as resp_info:
            quick.click()
        check('acción rápida: PATCH status 200', resp_info.value.status == 200, f'status {resp_info.value.status}')
        expect(row.get_by_text('Revisado', exact=True)).to_be_visible()
        check('acción rápida: la fila pasa a «Revisado» sin abrir la ficha', '/admin/orders?' in page.url, page.url)
        check_layout(page, 'bandeja')

        # --- Ficha: aprobar, deshacer, rechazar ---
        row.click()
        page.wait_for_url(f'**/admin/orders/{order_id}')
        expect(page.get_by_test_id('order-detail-number')).to_be_visible()
        check('clic en fila → ficha /admin/orders/:id', page.url.endswith(f'/admin/orders/{order_id}'), page.url)

        with page.expect_response(lambda r: is_status_change(r, order_id)) as resp_info:
            page.get_by_test_id('order-action-APPROVED').click()
        check('ficha: aprobar → PATCH 200', resp_info.value.status == 200, f'status {resp_info.value.status}')
        expect(page.get_by_test_id('order-action-MANUFACTURING')).to_be_visible()
        check('ficha: tras aprobar se ofrece «Pasar a producción»', page.get_by_test_id('order-action-MANUFACTURING').is_visible())

        page.get_by_test_id('order-action-undo').click()
        dialog = page.get_by_role('dialog')
        expect(dialog.get_by_text('Deshacer el último cambio')).to_be_visible()
        dialog.get_by_label('Motivo (obligatorio)').fill('ZZ Prueba: deshacer desde UI')
        with page.expect_response(lambda r: is_status_change(r, order_id, '/status/undo')) as resp_info:
            dialog.get_by_role('button', name='Deshacer').click()
        check('ficha: deshacer → POST undo 200', resp_info.value.status == 200, f'status {resp_info.value.status}')
        expect(page.get_by_test_id('order-action-APPROVED')).to_be_visible()
        expect(page.get_by_text('Deshecho: vuelve a Revisado')).to_be_visible()
        check('ficha: historial muestra el deshacer con su nota', page.get_by_text('ZZ Prueba: deshacer desde UI').count() >= 1)

        page.get_by_test_id('order-action-REJECTED').click()
        dialog = page.get_by_role('dialog')
        confirm = dialog.get_by_role('button', name='Rechazar')
        check('rechazar: sin motivo no se puede confirmar', confirm.is_disabled())
        dialog.get_by_label('Motivo (obligatorio)').fill('ZZ Prueba: medidas incorrectas')
        with page.expect_response(lambda r: is_status_change(r, order_id)) as resp_info:
            confirm.click()
        check('ficha: rechazar → PATCH 200', resp_info.value.status == 200, f'status {resp_info.value.status}')
        expect(page.get_by_text(re.compile(r'Motivo: ZZ Prueba: medidas incorrectas'))).to_be_visible()
        check('ficha: el seguimiento muestra el motivo del rechazo', page.get_by_test_id('order-action-REJECTED').count() == 0)
        check_layout(page, 'ficha')

        # --- Enlace antiguo ?orderId= ---
        page.goto(f'{BASE}/admin/orders?orderId={order_id}')
        page.wait_for_url(f'**/admin/orders/{order_id}')
        check('enlace antiguo ?orderId= → ficha', page.url.endswith(f'/admin/orders/{order_id}'), page.url)
        page.close()

        # --- WORKER ---
        worker = credentials('WORKER')
        if not worker[0]:
            print('OMITIDO worker — falta DEMO_USER_WORKER')
        else:
            page = browser.new_page(viewport={'width': 1440, 'height': 900})
            with page.expect_response(lambda r: '/orders/search' in r.url and r.request.method == 'GET') as resp_info:
                login(page, *worker)
            check('WORKER: tras el login cae en la bandeja', '/admin/orders' in page.url and resp_info.value.status == 200, page.url)
            expect(page.get_by_role('link', name='Pedidos')).to_be_visible()
            check('WORKER: menú con «Pedidos»', page.get_by_role('link', name='Pedidos').is_visible())
            page.close()

        browser.close()
except SystemExit:
    pass
finally:
    purge_status = purge_test_order(admin, user_token, created) if created else 200
    _, found = api('GET', f"/orders/search?q={created.get('name', 'ZZ Prueba bandeja UI').replace(' ', '%20')}", token=admin)
    leftovers = (found or {}).get('total', -1)
    check('limpieza: 0 residuos (orden, borrador y traza)', purge_status == 200 and leftovers == 0, f'purga {purge_status}, quedan {leftovers}')

done()
