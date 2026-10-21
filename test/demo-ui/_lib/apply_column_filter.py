"""
Helper reutilizable: aplica un filtro de columna nativo de MUI DataGrid (Community)
vía UI real. Usado para verificar el modal "¿Qué exportar?" (ExportCsvDialog) en
cualquier grid admin que tenga export CSV con soporte de alcance página/filtrado/todo.

Selectores confirmados contra la UI real (no adivinados):
- El botón de menú de columna tiene aria-label "Menú de la columna <Nombre visible>".
- El item de menú que abre el panel de filtro se llama "Filtro" (no "Filtrar").
- El input de valor del filtro tiene placeholder "Valor de filtro".

Uso:
    from apply_column_filter import apply_column_filter

    apply_column_filter(page, column_header_label="Categoría", value="HPL")
"""
from playwright.sync_api import expect


def apply_column_filter(page, column_header_label: str, value: str, operator_contains_default: bool = True):
    header = page.locator(f'div[role="columnheader"]:has-text("{column_header_label}")').first
    header.hover()
    page.get_by_label(f"Menú de la columna {column_header_label}").click()
    page.locator('li[role="menuitem"]', has_text="Filtro").first.click()

    value_input = page.locator('input[placeholder="Valor de filtro"]').first
    value_input.fill(value)
    expect(value_input).to_have_value(value)
    # El grid aplica el valor con debounce: el icono «Mostrar filtros» de la cabecera solo
    # aparece con el filtro ya aplicado (DataGrid 8). Cerrar antes lo descarta.
    expect(header.get_by_label("Mostrar filtros")).to_be_visible()
    page.keyboard.press("Escape")
    expect(value_input).to_be_hidden()
