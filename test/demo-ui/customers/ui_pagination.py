"""
Cubre la paginación de la lista de Customers: la etiqueta "x–y de z" y el selector
"Clientes por página:" están presentes y con valor.

No escribe datos (solo lectura). Captura en customers/capturas/customers_page.png.

Lanzar: npm run test:demo -- customers factory=DEMO
"""
import pathlib
import sys
from playwright.sync_api import sync_playwright, expect

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / '_lib'))
from factory_env import credentials, admin_token, assert_factory, check, done
from pw_common import launch, login, goto_admin

CAPTURAS = pathlib.Path(__file__).resolve().parent / 'capturas'
CAPTURAS.mkdir(parents=True, exist_ok=True)

assert_factory(admin_token())

with sync_playwright() as p:
    browser = launch(p)
    page = browser.new_page()
    login(page, *credentials('ADMIN'))
    goto_admin(page, "customers")

    label = page.locator(".MuiTablePagination-displayedRows")
    expect(label).to_be_visible()
    page.screenshot(path=str(CAPTURAS / "customers_page.png"), full_page=True)

    text = (label.text_content() or "").strip()
    check("etiqueta de paginación presente (x–y de z)", " de " in text, text)

    rows_select = page.get_by_role("combobox", name="Clientes por página:")
    check("selector 'Clientes por página' presente", rows_select.count() == 1, f"{rows_select.count()} selectores")
    value = (rows_select.text_content() or "").strip() if rows_select.count() else ""
    check("selector con un pageSize numérico", value.isdigit(), value)

    browser.close()

done()
