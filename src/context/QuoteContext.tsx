// src/context/QuoteContext.tsx
import React, { createContext, useReducer, useContext, type Dispatch } from "react";

// 1. Define la forma completa de los datos
export interface QuoteState {
  step: number;
  // Step 1
  materialId?: string;
  materialName?: string;
  thickness?: number;
  finish?: string;
  group?: string;
  face?: string;
  // Step 2
  shape?: "Lineal" | "L" | "U";
  measurements: {
    fondo?: number;
    ladoA?: number;
    ladoB?: number;
    ladoC?: number;
    copete?: number;
  };
  // Step 3
  edgeProfileId?: string;
  edgeProfileName?: string;
  cutouts: CutoutSelection[];
  // Step 4
  contactDetails: {
    name?: string;
    email?: string;
    phone?: string;
  };
  backsplashMeters?: number;
  // Campos para el resumen
  totalPrice?: number;
  priceBreakdown?: Record<string, number>;
}

interface CutoutSelection {
  cutoutId: string;
  name: string;
  price: number;
  quantity: number;
}

// 2. Define TODAS las acciones que pueden modificar el estado
type Action =
  | { type: "SET_STEP"; payload: number }
  | { type: "SET_MATERIAL"; payload: { materialId: string; materialName: string } }
  | { type: "SET_DETAILS"; payload: { thickness: number; finish: string } }
  | { type: "SET_PRICE_OPTIONS"; payload: { group: string; face: string } }
  | { type: "SET_SHAPE_AND_MEASUREMENTS"; payload: Partial<QuoteState["measurements"]> & { shape?: QuoteState["shape"] } }
  | { type: "SET_EDGE_PROFILE"; payload: { edgeProfileId: string; edgeProfileName: string } }
  | { type: "SET_CUTOUTS"; payload: CutoutSelection[] }
  | { type: "SET_CONTACT_DETAILS"; payload: Partial<QuoteState["contactDetails"]> }
  | { type: "RESET" };

// 3. Define el estado inicial
const initialState: QuoteState = {
  step: 0,
  measurements: {},
  cutouts: [],
  contactDetails: {},
};

// 4. Actualiza el reducer para manejar las nuevas acciones
const quoteReducer = (state: QuoteState, action: Action): QuoteState => {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, step: action.payload };
    case "SET_MATERIAL":
      return { ...state, materialId: action.payload.materialId, materialName: action.payload.materialName, group: undefined, face: undefined };
    case "SET_DETAILS":
      return { ...state, thickness: action.payload.thickness, finish: action.payload.finish };
    case "SET_PRICE_OPTIONS":
      return { ...state, group: action.payload.group, face: action.payload.face };
    case "SET_SHAPE_AND_MEASUREMENTS":
      return {
        ...state,
        shape: action.payload.shape || state.shape,
        measurements: { ...state.measurements, ...action.payload },
      };
    case "SET_EDGE_PROFILE":
      return { ...state, edgeProfileId: action.payload.edgeProfileId, edgeProfileName: action.payload.edgeProfileName };
    case "SET_CUTOUTS":
      return { ...state, cutouts: action.payload };
    case "SET_CONTACT_DETAILS":
      return { ...state, contactDetails: { ...state.contactDetails, ...action.payload } };
    case "RESET":
      return initialState;
    default:
      return state;
  }
};

// 5. Crea el Contexto de React
const QuoteStateContext = createContext<QuoteState | undefined>(undefined);
const QuoteDispatchContext = createContext<Dispatch<Action> | undefined>(undefined);

// 6. Crea el Proveedor (Provider) que envolverá nuestra aplicación
export const QuoteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(quoteReducer, initialState);

  return (
    <QuoteStateContext.Provider value={state}>
      <QuoteDispatchContext.Provider value={dispatch}>{children}</QuoteDispatchContext.Provider>
    </QuoteStateContext.Provider>
  );
};

// 7. Crea hooks personalizados para acceder fácilmente al estado y a las acciones
export const useQuoteState = () => {
  const context = useContext(QuoteStateContext);
  if (context === undefined) {
    throw new Error("useQuoteState must be used within a QuoteProvider");
  }
  return context;
};

export const useQuoteDispatch = () => {
  const context = useContext(QuoteDispatchContext);
  if (context === undefined) {
    throw new Error("useQuoteDispatch must be used within a QuoteProvider");
  }
  return context;
};
