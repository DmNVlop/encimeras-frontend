// src/utils/dataGrid.util.ts

/**
 * Calcula las opciones de tamaño de página para un DataGrid admin, incluyendo
 * siempre el total real de filas como última opción ("ver todo en una página").
 * Evita ofrecer un tamaño mayor al total (ej. no mostrar "250" si solo hay 40 filas).
 *
 * Siempre devuelve al menos 2 opciones (la más chica de `baseOptions` + el total):
 * si con pocos datos totalCount cae por debajo de todas las opciones base, el
 * selector "filas por página" de MUI (TablePagination/DataGrid) se oculta cuando
 * queda una sola opción — con un dataset chico (dev/demo) eso pasaba siempre.
 */
export function getPageSizeOptions(totalCount: number, baseOptions: number[] = [10, 50, 100, 250]): number[] {
  const options = baseOptions.filter((size) => size < totalCount);
  if (totalCount > 0 && !options.includes(totalCount)) {
    options.push(totalCount);
  }
  if (options.length < 2) {
    const extra = baseOptions.find((size) => !options.includes(size));
    if (extra !== undefined) options.push(extra);
  }
  options.sort((a, b) => a - b);
  return options.length > 0 ? options : baseOptions;
}
