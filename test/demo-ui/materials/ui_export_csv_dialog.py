"""
Cubre el modal "¿Qué datos exportar?" (ExportCsvDialog, componente compartido) en
Materials: sin filtro los conteos "Todas las páginas" y "Todo el listado" coinciden con el
total y "Página actual" no lo supera; con un filtro de columna activo, "Resultado
filtrado" baja a los materiales filtrados y "Todo el listado" se mantiene en el total.

Escribe (por API): 2 materiales «ZZ Prueba Dialogo 1/2» (refs ZZPRUEBA-DLG1/2, categoría
«ZZ Prueba Cat») para filtrar por una categoría propia; los borra al terminar (try/finally).

Lanzar: npm run test:demo -- materials factory=DEMO
"""
import pathlib
import re
import sys
from playwright.sync_api import sync_playwright, expect

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / '_lib'))
from factory_env import credentials, admin_token, assert_factory, check, done
from pw_common import launch, login, goto_admin
from apply_column_filter import apply_column_filter
from test_data import create_material, cleanup_materials

CATEGORY = "ZZ Prueba Cat"


def count_of(page, label_text):
    """Nº de filas de la opción del modal cuyo texto contiene `label_text` (`... (N filas)`)."""
    label = page.locator(f'label:has-text("{label_text}")')
    expect(label).to_be_visible()
    m = re.search(r"\((\d+) filas\)", label.text_content() or "")
    return int(m.group(1)) if m else None


token = admin_token()
assert_factory(token)

try:
    create_material(token, "ZZPRUEBA-DLG1", "ZZ Prueba Dialogo 1", CATEGORY)
    create_material(token, "ZZPRUEBA-DLG2", "ZZ Prueba Dialogo 2", CATEGORY)

    with sync_playwright() as p:
        browser = launch(p)
        page = browser.new_page()
        login(page, *credentials('ADMIN'))
        goto_admin(page, "materials")

        page.get_by_role("button", name="Exportar materiales a CSV", exact=True).click()
        page_n = count_of(page, "Página actual")
        all_pages_n = count_of(page, "Todas las páginas")
        total_n = count_of(page, "Todo el listado")
        check("sin filtro: total >= 2 (materiales de prueba)", total_n is not None and total_n >= 2, f"total={total_n}")
        check("sin filtro: 'Todas las páginas' = total", all_pages_n == total_n, f"{all_pages_n} vs {total_n}")
        check("sin filtro: 'Página actual' <= total", page_n is not None and total_n is not None and page_n <= total_n, f"{page_n} vs {total_n}")
        page.get_by_role("button", name="Cancelar").click()
        expect(page.locator('label:has-text("Todo el listado")')).to_be_hidden()

        apply_column_filter(page, "Categoría", CATEGORY)

        page.get_by_role("button", name="Exportar materiales a CSV", exact=True).click()
        filtered_n = count_of(page, "filtrado")
        page_f = count_of(page, "Página actual")
        total_f = count_of(page, "Todo el listado")
        check("con filtro: 'Resultado filtrado' = 2", filtered_n == 2, f"filtrado={filtered_n}")
        check("con filtro: 'Página actual' <= 2", page_f is not None and page_f <= 2, f"pagina={page_f}")
        check("con filtro: 'Todo el listado' sigue en el total sin filtrar", total_f == total_n, f"{total_f} vs {total_n}")

        browser.close()
except Exception as e:
    check('sin excepciones', False, f'{type(e).__name__}: {str(e).splitlines()[0] if str(e) else ""}')
finally:
    remaining = cleanup_materials(token)

check("limpieza: 0 materiales ZZPRUEBA residuales", remaining == 0, f"{remaining} restantes")
done()
