// src/utils/csv.util.ts
// Helper CSV único, usado tanto para import como export en todos los módulos admin.
// Separador de columnas: ";". Separador de arrays dentro de una celda: ",".
// Ver docs/development/plan-mejoras-carga-datos-admin.md sección 1.

/**
 * Parsea texto CSV a una matriz de filas x columnas.
 * Soporta: BOM UTF-8, saltos de línea CRLF y LF, comillas dobles RFC 4180
 * (separador y comillas escapables dentro de un campo entre comillas).
 */
export function parseCsv(text: string, separator = ";"): string[][] {
  // Quitar BOM UTF-8 si está presente (Excel lo agrega al guardar CSV)
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === separator) {
      row.push(field);
      field = "";
    } else if (char === "\r") {
      // ignorar: el \n siguiente cierra la fila (CRLF); si viniera un \r suelto, también se ignora
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  // última fila (si el archivo no termina en salto de línea)
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // descartar filas completamente vacías (p.ej. línea final en blanco)
  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}

/** Escapa un valor para uso seguro como campo CSV. */
function escapeCsvField(value: string, separator: string): string {
  if (value.includes('"') || value.includes(separator) || value.includes("\n") || value.includes("\r")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Serializa headers + filas de datos a texto CSV.
 * `rows` ya debe tener los valores como string (ver mapeos de columnas por módulo).
 */
export function buildCsv(headers: string[], rows: Record<string, string>[], separator = ";"): string {
  const lines = [headers.map((h) => escapeCsvField(h, separator)).join(separator)];

  for (const row of rows) {
    const line = headers.map((h) => escapeCsvField(row[h] ?? "", separator)).join(separator);
    lines.push(line);
  }

  return lines.join("\r\n");
}

/** Serializa un array de strings a una celda CSV, separado por coma. */
export function arrayToCsvField(arr: string[] | undefined | null): string {
  if (!arr || arr.length === 0) return "";
  return arr.join(",");
}

/** Parsea una celda CSV separada por coma a array de strings. */
export function csvFieldToArray(field: string | undefined | null): string[] {
  if (!field) return [];
  return field
    .split(",")
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

/** Serializa un booleano a su literal CSV ("true"/"false"). */
export function boolToCsvField(b: boolean | undefined | null): string {
  return b ? "true" : "false";
}

/** Parsea el literal CSV ("true"/"false") a booleano. */
export function csvFieldToBool(field: string | undefined | null): boolean {
  return (field ?? "").trim().toLowerCase() === "true";
}

/** Dispara la descarga de un archivo CSV en el navegador. */
export function downloadCsv(filename: string, csvContent: string): void {
  const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
