"""
Cubre el borrado de Customers (orden de rutas @Delete("batch") vs @Delete(":id") en
customers.controller.ts, bug de 2026-07-14). Todo por UI real:

1. Crea un cliente «ZZ Prueba Individual Solo» -> lo borra individualmente (botón
   "Eliminar" con una sola card seleccionada) -> desaparece de la lista y de la API.
2. Crea «ZZ Prueba Borrar Uno» y «ZZ Prueba Borrar Dos» -> los selecciona (Ctrl+clic) ->
   borrado en batch (barra de acciones) -> ambos desaparecen de la lista y de la API.

Escribe: 3 clientes «ZZ Prueba …» creados por UI; el test los borra por UI y, en el
finally, por API cualquier resto (incluido si falló a medias).

Lanzar: npm run test:demo -- customers factory=DEMO
"""
import pathlib
import sys
from playwright.sync_api import sync_playwright, expect

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / '_lib'))
from factory_env import credentials, admin_token, assert_factory, check, done
from pw_common import launch, login, goto_admin
from test_data import cleanup_customers, list_customers


def create_customer_ui(page, first_name: str, last_name: str, nif: str):
    # Modo default del drawer es INDIVIDUAL -> pide Nombre/Apellidos (no Razón Social).
    # Labels reales llevan asterisco ("Nombre *"/"Apellidos *").
    page.get_by_role("button", name="Nuevo Cliente").click()
    name_input = page.get_by_label("Nombre *")
    expect(name_input).to_be_visible()
    name_input.fill(first_name)
    page.get_by_label("Apellidos *").fill(last_name)
    page.get_by_label("CIF / NIF / DNI").fill(nif)
    with page.expect_response(lambda r: r.request.method == "POST" and r.url.rstrip("/").endswith("/customers")):
        page.get_by_role("button", name="Guardar", exact=False).click()
    expect(name_input).to_be_hidden()


token = admin_token()
assert_factory(token)

try:
    with sync_playwright() as p:
        browser = launch(p)
        page = browser.new_page()
        login(page, *credentials('ADMIN'))
        goto_admin(page, "customers")
        search = page.get_by_placeholder("Buscar cliente...")

        # --- 1. Borrado individual ---
        create_customer_ui(page, "ZZ Prueba Individual", "Solo", "ZZPRDEL01")
        search.fill("ZZ Prueba Individual Solo")
        expect(page.get_by_text("ZZ Prueba Individual Solo", exact=False).first).to_be_visible()
        check("alta por UI del cliente individual", len(list_customers(token)) == 1)

        page.get_by_text("ZZ Prueba Individual Solo", exact=False).first.click()
        expect(page.get_by_text("1 cliente seleccionado", exact=True)).to_be_visible()
        page.get_by_role("button", name="Eliminar clientes seleccionados", exact=True).click()
        expect(page.get_by_text("¿Estás seguro de que quieres eliminar")).to_be_visible()
        with page.expect_response(lambda r: r.request.method == "DELETE" and "/customers" in r.url) as resp1:
            page.get_by_role("button", name="Eliminar", exact=True).last.click()
        check("borrado individual: el backend responde sin error (sin 500)", resp1.value.ok, f"HTTP {resp1.value.status}")
        expect(page.get_by_text("ZZ Prueba Individual Solo", exact=False)).to_have_count(0)
        check("borrado individual: el cliente ya no aparece en la lista", page.get_by_text("ZZ Prueba Individual Solo", exact=False).count() == 0)
        check("borrado individual: ya no está activo en la API", len(list_customers(token)) == 0)

        # --- 2. Borrado en batch (2 clientes) ---
        search.fill("")
        create_customer_ui(page, "ZZ Prueba Borrar", "Uno", "ZZPRDEL02")
        create_customer_ui(page, "ZZ Prueba Borrar", "Dos", "ZZPRDEL03")
        search.fill("ZZ Prueba Borrar")
        uno = page.get_by_text("ZZ Prueba Borrar Uno", exact=False)
        dos = page.get_by_text("ZZ Prueba Borrar Dos", exact=False)
        expect(uno.first).to_be_visible()
        expect(dos.first).to_be_visible()
        check("alta por UI de los 2 clientes batch", len(list_customers(token)) == 2)

        # Ctrl+clic para multi-selección (mismo patrón que handleRowClick en CustomersPage.tsx)
        uno.first.click()
        dos.first.click(modifiers=["Control"])
        # Chip de la barra de selección (CustomersPage): confirma la multiselección antes de borrar
        expect(page.get_by_text("2 clientes seleccionados", exact=True)).to_be_visible()

        page.get_by_role("button", name="Eliminar clientes seleccionados", exact=True).click()
        expect(page.get_by_text("¿Estás seguro de que quieres eliminar")).to_be_visible()
        with page.expect_response(lambda r: r.request.method == "DELETE" and "/customers/batch" in r.url) as resp2:
            page.get_by_role("button", name="Eliminar", exact=True).last.click()
        check("borrado batch: DELETE /customers/batch responde sin error (sin 500)", resp2.value.ok, f"HTTP {resp2.value.status}")
        expect(uno).to_have_count(0)
        expect(dos).to_have_count(0)
        check("borrado batch: ambos desaparecen de la lista", uno.count() == 0 and dos.count() == 0)
        check("borrado batch: ya no están activos en la API", len(list_customers(token)) == 0)

        browser.close()
except Exception as e:
    check('sin excepciones', False, f'{type(e).__name__}: {str(e).splitlines()[0] if str(e) else ""}')
finally:
    remaining = cleanup_customers(token)

check("limpieza: 0 clientes «ZZ Prueba» residuales", remaining == 0, f"{remaining} activos")
done()
