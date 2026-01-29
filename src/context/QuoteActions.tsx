import type { AppliedAddon, MainPiece, SelectedAttributes, ShapeVariationPayload } from "./QuoteInterfases";

/**
 * DEFINICIÓN DE ACCIONES
 */
export type QuoteAction =
  // --- ACCIONES DEL WIZARD (NUEVAS / ACTUALIZADAS) ---
  | {
      type: "SET_WIZARD_MATERIAL"; // Step 1
      payload: {
        materialId: string;
        materialName: string;
        materialImage?: string;
        selectedAttributes: SelectedAttributes;
      };
    }
  | {
      type: "SET_SHAPE_AND_CREATE_PIECES"; // Step 2 (Forma)
      payload: { count: number };
    }
  | { type: "SET_SHAPE_VARIATION_AND_CREATE_PIECES"; payload: ShapeVariationPayload }
  | { type: "RESET_SHAPE" }
  | {
      type: "UPDATE_PIECE_MEASUREMENTS"; // Step 2 (Medidas)
      payload: {
        pieceIndex: number;
        measurements: { length_mm: number; width_mm: number };
      };
    }
  // --- ACCIONES GENÉRICAS (Ya existían / Reutilizadas) ---
  | { type: "SET_ACTIVE_PIECE"; payload: { index: number | null } }
  | {
      type: "UPDATE_MAIN_PIECE"; // Para Step 2 (Cambiar material individual)
      payload: { pieceIndex: number; data: Partial<MainPiece> };
    }
  | {
      type: "ADD_ADDON_TO_PIECE"; // Para Step 3 y 4
      payload: { pieceIndex: number; addon: AppliedAddon };
    }
  | {
      type: "REMOVE_ADDON_FROM_PIECE"; // Para Step 3 y 4
      payload: { pieceIndex: number; addonIndex: number };
    }
  | {
      type: "UPDATE_ADDON_IN_PIECE"; // Para Step 3 y 4
      payload: {
        pieceIndex: number;
        addonIndex: number;
        data: Partial<AppliedAddon>;
      };
    }
  // ... Acciones de Cálculo (CALCULATION_START, etc. siguen igual)
  | { type: "CALCULATION_START" }
  | { type: "CALCULATION_SUCCESS"; payload: { results: any } }
  | { type: "CALCULATION_ERROR"; payload: { error: string } }
  | { type: "LOAD_SAVED_PROJECT"; payload: any }
  | { type: "SET_DRAFT_ID"; payload: string };
