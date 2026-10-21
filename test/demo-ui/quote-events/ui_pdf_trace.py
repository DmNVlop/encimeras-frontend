"""
Trazabilidad de presupuestos desde la UI: al descargar el PDF del carrito, el botón registra
`POST /quote-events/pdf-download {source: "cart"}` y el backend guarda un PDF_DOWNLOADED enlazado
al quoteTraceId del ítem.

Escribe: 1 ítem «ZZ Prueba traza UI <marca>» en el carrito del USER (por API, con quoteTraceId propio)
y sus eventos. En el `finally` se borra el ítem y el ADMIN purga la traza; check de 0 residuos.
Si el carrito del USER no está vacío: OMITIDO (no se registran eventos de presupuestos ajenos a la prueba).
PDF en quote-events/capturas/.

Lanzar: npm run test:demo -- quote-events factory=DEMO
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

CAPTURAS = pathlib.Path(__file__).resolve().parent / 'capturas'
CAPTURAS.mkdir(parents=True, exist_ok=True)

admin = admin_token()
assert_factory(admin)

piece = find_priced_piece(admin)
user_token = api_login(*credentials('USER'))
if not piece:
    print('OMITIDO trazabilidad PDF — no hay material con receta ENCIMERA y precio configurado')
    done()
if not check('login USER por API', bool(user_token)):
    done()

_, cart = api('GET', '/cart', token=user_token)
if (cart or {}).get('items'):
    print('OMITIDO trazabilidad PDF — el carrito del USER no está vacío')
    done()

trace = str(uuid.uuid4())
name = f'ZZ Prueba traza UI {int(time.time())}'
cart_item_id = None

try:
    status, body = api('POST', '/cart/items', {'customName': name, 'core': {'mainPieces': [piece], 'factoryId': ENV['FACTORY_ID']}, 'quoteTraceId': trace}, token=user_token)
    item = next((i for i in (body or {}).get('items', []) if i.get('quoteTraceId') == trace), None)
    cart_item_id = item and item.get('cartItemId')
    check('ítem de prueba en el carrito (API)', status == 201 and bool(cart_item_id), f'status {status}')

    with sync_playwright() as p:
        browser = launch(p)
        page = browser.new_page()
        login(page, *credentials('USER'))
        page.goto(f'{BASE}/cart')
        # El nombre sale 3 veces (tarjeta, resumen y menú del carrito): la tarjeta es el heading
        expect(page.get_by_role('heading', name=name, exact=True)).to_be_visible()

        # El botón pasa por «Preparando documento...» hasta que el PDF está listo
        pdf_button = page.get_by_text('Descargar resumen PDF')
        expect(pdf_button).to_be_visible(timeout=30000)
        with page.expect_response(lambda r: '/quote-events/pdf-download' in r.url and r.request.method == 'POST') as resp_info, page.expect_download() as download_info:
            pdf_button.click()
        resp = resp_info.value
        download_info.value.save_as(str(CAPTURAS / 'presupuesto_carrito.pdf'))

        check('clic en PDF → POST pdf-download 201', resp.status == 201, f'status {resp.status}')
        check('el FE envía solo el origen (sin ids)', resp.request.post_data_json == {'source': 'cart'}, str(resp.request.post_data_json))
        check('un evento por presupuesto del carrito', (resp.json() or {}).get('recorded') == 1, str(resp.json()))
        browser.close()

    _, events = api('GET', f'/quote-events?quoteTraceId={trace}', token=user_token)
    pdf_events = [e for e in events or [] if e.get('type') == 'PDF_DOWNLOADED']
    check('PDF_DOWNLOADED enlazado al ítem y a la fábrica',
          len(pdf_events) == 1 and pdf_events[0].get('cartItemId') == cart_item_id and pdf_events[0].get('factoryId') == ENV['FACTORY_ID'],
          str(pdf_events))
finally:
    if cart_item_id:
        api('DELETE', f'/cart/items/{cart_item_id}', token=user_token)
    purge_status, _ = api('DELETE', f'/quote-events/{trace}', token=admin)
    _, left = api('GET', f'/quote-events?quoteTraceId={trace}', token=admin)
    _, cart_after = api('GET', '/cart', token=user_token)
    leftovers = len(left or []) + len([i for i in (cart_after or {}).get('items', []) if i.get('customName') == name])
    check('limpieza: 0 residuos (ítem y eventos)', purge_status == 200 and leftovers == 0, f'purga {purge_status}, quedan {leftovers}')

done()
