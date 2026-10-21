"""
Helper reutilizable: borra una fila de un DataGrid admin (MUI x-data-grid) ubicándola
por texto visible y clickeando su acción "Eliminar".

Importante: GridActionsCellItem de MUI renderiza los botones de accion como IconButton
con `aria-label` (no texto visible) — usar get_by_label(), NO get_by_role(name=...).

Uso:
    from delete_grid_row_by_text import delete_grid_row

    delete_grid_row(page, "ZZPRUEBA01")
"""
from playwright.sync_api import expect


def delete_grid_row(page, row_text: str, action_label: str = "Eliminar"):
    row = page.locator(f'div[role="row"]:has-text("{row_text}")')
    page.once("dialog", lambda d: d.accept())
    row.get_by_label(action_label).click()
    expect(row).to_have_count(0)
