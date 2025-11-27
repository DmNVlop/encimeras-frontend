// =============================================================================
// SECCIÓN DE INTERFACES Y TIPOS

import type { PieceLayout } from "../context/QuoteContext";

// =============================================================================
export type SelectionState = Record<string, string>;

// --- Interfaces para las propiedades de la forma ---
export interface EncimeraPreviewPiece {
  id: string;
  area: string;
  borderRadius?: string;
}

export interface EncimeraGrid {
  columns: string;
  rows: string;
  aspectRatio?: string;
}

// --- Define el tipo para una Shape Variation (Estructura SIMPLIFICADA) ---
export interface ShapeVariation {
  id: string; // Reemplaza a 'code'
  group: string;
  name: string; // Reemplaza a 'label'
  count: number;
  grid: EncimeraGrid; // Propiedad a nivel superior
  pieces: EncimeraPreviewPiece[]; // Propiedad a nivel superior
  piecesLayout?: PieceLayout[];
  defaultMeasurements: { length_mm: number; width_mm: number }[];
}
