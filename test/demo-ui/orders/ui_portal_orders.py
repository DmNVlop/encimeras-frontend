"""
Portal de pedidos del cliente: «Mis presupuestos» `/my-quotes` (GET /orders/search) y detalle `/my-quotes/:id`.

Con USER: busca su orden de prueba, ve el contador «En curso», abre el detalle (volver conserva la búsqueda) y puede
cancelar en PENDING. Mientras mira el detalle, OWNER (por API) recorre el flujo completo
REVIEWED → APPROVED → MANUFACTURING → SHIPPED → INSTALLED y el detalle se actualiza solo (socket): estado, desaparece
«Cancelar pedido» tras revisar e historial sin autor. Al final la orden cuenta en «Entregados».
Segunda orden: el USER la cancela con motivo (sin motivo no confirma) y ve el motivo en el seguimiento y en «Rechazados / cancelados».
Layout sin solapes ni scroll horizontal a 1440/1024/768/390 en lista y detalle.

Escribe: 2 órdenes «ZZ Prueba portal UI flujo|cancela <marca>» del USER (por API, desde borradores propios).
En el `finally` la purga ADMIN (`DELETE /orders/:id`) las borra con su borrador y su traza; check de 0 residuos.

Lanzar: npm run test:demo -- orders factory=DEMO
"""
import pathlib
import sys
from playwright.sync_api import sync_playwright, expect

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / '_lib'))
from factory_env import ENV, BASE, api, login as api_login, credentials, admin_token, assert_factory, check, done
from pw_common import launch, login
from test_data import find_priced_piece, create_test_order, purge_test_order
from layout_check import VIEWPORTS, layout_issues

admin = admin_token()
assert_factory(admin)

owner = credentials('OWNER')
user = credentials('USER')
piece = find_priced_piece(admin)
user_token = api_login(*user)
owner_token = api_login(*owner) if owner[0] else None
if not owner[0]:
    print('OMITIDO portal orders — falta DEMO_USER_OWNER')
    done()
if not piece:
    print('OMITIDO portal orders — no hay material con receta ENCIMERA y precio configurado')
    done()
if not check('login USER y OWNER por API', bool(user_token) and bool(owner_token)):
    done()

created = []
FLOW = [('REVIEWED', 'Revisado'), ('APPROVED', 'Aprobado'), ('MANUFACTURING', 'En Producción'), ('SHIPPED', 'Enviado'), ('INSTALLED', 'Entregado')]


def check_layout(page, label):
    for width, height in VIEWPORTS:
        page.set_viewport_size({'width': width, 'height': height})
        issues = layout_issues(page)
        check(f'{label}: layout {width}px sin solapes ni scroll horizontal', not issues, '; '.join(issues))
    page.set_viewport_size({'width': 1440, 'height': 900})


def open_list(page, query, tab=None):
    url = f'{BASE}/my-quotes?q={query.replace(" ", "+")}' + (f'&tab={tab}' if tab else '')
    with page.expect_response(lambda r: '/orders/search' in r.url and 'q=' in r.url and r.request.method == 'GET') as resp_info:
        page.goto(url)
    return resp_info.value


try:
    # Etiquetas distintas: la marca es por segundo y la búsqueda por nombre debe dar una sola orden
    for label in ('portal UI flujo', 'portal UI cancela'):
        created.append(create_test_order(user_token, piece, ENV['FACTORY_ID'], label))
    flow_order, cancel_order = created
    if not check('órdenes de prueba (API)', all(c['orderId'] for c in created), '; '.join(c['error'] or '' for c in created)):
        raise SystemExit
    flow_id, cancel_id = flow_order['orderId'], cancel_order['orderId']

    with sync_playwright() as p:
        browser = launch(p)
        page = browser.new_page(viewport={'width': 1440, 'height': 900})
        login(page, *user)

        # --- Lista: búsqueda en servidor y contadores ---
        resp = open_list(page, flow_order['name'])
        check('lista: GET /orders/search 200', resp.status == 200, f'status {resp.status}')
        card = page.get_by_test_id(f'portal-order-{flow_id}')
        expect(card).to_be_visible()
        check('lista: la orden sale buscando por nombre (y solo ella)', page.get_by_test_id('portal-orders-list').locator('[data-testid^="portal-order-"]').count() == 1)
        expect(page.get_by_test_id('portal-tab-active')).to_contain_text('(1)')
        check('lista: «En curso (1)» con la búsqueda', '(1)' in page.get_by_test_id('portal-tab-active').inner_text())
        check_layout(page, 'lista portal')

        # --- Detalle y volver con la búsqueda ---
        card.click()
        page.wait_for_url(f'**/my-quotes/{flow_id}')
        status_chip = page.get_by_test_id('portal-order-status')
        expect(status_chip).to_contain_text('Pendiente')
        check('detalle: seguimiento visible', page.get_by_test_id('portal-order-progress').is_visible())
        expect(page.get_by_test_id('portal-order-history')).to_contain_text('Pedido recibido')
        check('detalle: USER puede cancelar en PENDING', page.get_by_test_id('order-action-CANCELLED').is_visible())
        check_layout(page, 'detalle portal')

        page.get_by_role('button', name='Volver a Mis Presupuestos').click()
        page.wait_for_url('**/my-quotes?**')
        check('volver conserva la búsqueda', 'q=' in page.url, page.url)
        page.get_by_test_id(f'portal-order-{flow_id}').click()
        page.wait_for_url(f'**/my-quotes/{flow_id}')
        expect(status_chip).to_contain_text('Pendiente')

        # --- Flujo completo hecho por la fábrica (OWNER por API); el detalle se actualiza por socket ---
        for status, label in FLOW:
            code, _ = api('PATCH', f'/orders/{flow_id}/status', {'status': status}, token=owner_token)
            if not check(f'OWNER pasa a {status} (API 200)', code == 200, f'status {code}'):
                raise SystemExit
            expect(status_chip).to_contain_text(label)
            check(f'detalle se actualiza solo a «{label}»', label in status_chip.inner_text())
            if status == 'REVIEWED':
                expect(page.get_by_test_id('order-action-CANCELLED')).to_have_count(0)
                check('tras revisar, el USER ya no puede cancelar', page.get_by_test_id('order-action-CANCELLED').count() == 0)

        history = page.get_by_test_id('portal-order-history')
        expect(history).to_contain_text('Entregado')
        owner_name = (api('GET', '/auth/me', token=owner_token)[1] or {}).get('name') or '\0'
        check('historial con el flujo completo y sin autor', all(l in history.inner_text() for _, l in FLOW) and owner_name not in history.inner_text())

        resp = open_list(page, flow_order['name'], 'INSTALLED')
        expect(page.get_by_test_id(f'portal-order-{flow_id}')).to_be_visible()
        check('lista: la orden cuenta en «Entregados (1)»', '(1)' in page.get_by_test_id('portal-tab-INSTALLED').inner_text())

        # --- Cancelar con motivo (segunda orden) ---
        page.goto(f'{BASE}/my-quotes/{cancel_id}')
        cancel_btn = page.get_by_test_id('order-action-CANCELLED')
        expect(cancel_btn).to_be_visible()
        cancel_btn.click()
        dialog = page.get_by_role('dialog')
        confirm = dialog.get_by_role('button', name='Cancelar pedido', exact=True)
        check('cancelar: sin motivo no se puede confirmar', confirm.is_disabled())
        dialog.get_by_label('Motivo (obligatorio)').fill('ZZ Prueba: ya no lo necesito')
        with page.expect_response(lambda r: f'/orders/{cancel_id}/status' in r.url and r.request.method == 'PATCH') as resp_info:
            confirm.click()
        check('cancelar: PATCH 200', resp_info.value.status == 200, f'status {resp_info.value.status}')
        expect(status_chip).to_contain_text('Cancelado')
        expect(page.get_by_test_id('portal-order-progress')).to_contain_text('Motivo: ZZ Prueba: ya no lo necesito')
        check('cancelar: seguimiento con el motivo y sin más acciones', page.get_by_test_id('order-action-CANCELLED').count() == 0)

        open_list(page, cancel_order['name'], 'closed')
        expect(page.get_by_test_id(f'portal-order-{cancel_id}')).to_be_visible()
        check('lista: la cancelada cuenta en «Rechazados / cancelados (1)»', '(1)' in page.get_by_test_id('portal-tab-closed').inner_text())

        browser.close()
except SystemExit:
    pass
finally:
    statuses = [purge_test_order(admin, user_token, c) for c in created]
    leftovers = 0
    for c in created:
        _, found = api('GET', f"/orders/search?q={c['name'].replace(' ', '%20')}", token=admin)
        leftovers += (found or {}).get('total', 1)
    check('limpieza: 0 residuos (órdenes, borradores y trazas)', all(s == 200 for s in statuses) and leftovers == 0, f'purgas {statuses}, quedan {leftovers}')

done()
