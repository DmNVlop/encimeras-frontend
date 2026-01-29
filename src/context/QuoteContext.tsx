// frontend/src/context/QuoteContext.tsx

import React, { createContext, useContext, useReducer, type Dispatch } from "react";
import type { MainPiece, QuoteState } from "./QuoteInterfases";
import type { QuoteAction } from "./QuoteActions";
import { quoteReducer } from "./QuoteReducer";

/**
 * Genera una nueva pieza vacío por defecto.
 * Esta función se usará en el reducer.
 */
export const createDefaultPiece = (): MainPiece => ({
  id: `piece_${Date.now()}_${Math.random()}`, // ID más único
  materialId: null,
  selectedAttributes: {},
  measurements: { length_mm: 2000, width_mm: 600 },
  appliedAddons: [],
});

/**
 * El estado inicial de la aplicación.
 */
export const initialState: QuoteState = {
  mainPieces: [],
  activePieceIndex: null,
  selectedShapeId: null,
  wizardTempMaterial: null,
  isCalculating: false,
  calculationResult: null,
  error: null,
  currentDraftId: null,
  isDraftRecalculated: false,
};

// --- 5. CONTEXTO, PROVIDER Y HOOKS (Sin cambios) ---
const QuoteStateContext = createContext<QuoteState | undefined>(undefined);
const QuoteDispatchContext = createContext<Dispatch<QuoteAction> | undefined>(undefined);

export const QuoteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(quoteReducer, initialState);
  return (
    <QuoteStateContext.Provider value={state}>
      <QuoteDispatchContext.Provider value={dispatch}>{children}</QuoteDispatchContext.Provider>
    </QuoteStateContext.Provider>
  );
};

export const useQuoteState = () => {
  const context = useContext(QuoteStateContext);
  if (context === undefined) {
    throw new Error("useQuoteState debe usarse dentro de un QuoteProvider");
  }
  return context;
};

/**
 * Hook para obtener la función dispatch y poder ejecutar acciones.
 */
export const useQuoteDispatch = () => {
  const context = useContext(QuoteDispatchContext);
  if (context === undefined) {
    throw new Error("useQuoteDispatch debe usarse dentro de un QuoteProvider");
  }
  return context;
};
