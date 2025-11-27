// frontend/src/context/QuoteContext.tsx

import React, { createContext, useContext, useReducer, type Dispatch } from "react";

/**
 * Representa los atributos seleccionados.
 * Ejemplo: { MAT_GROUP: 'Basic', MAT_FINISH: 'OAK' }
 */
export interface SelectedAttributes {
  [key: string]: string;
}

/**
 * Representa un accesorio que el usuario ha añadido a una pieza.
 * Esto es lo que se enviará al backend.
 */
export interface AppliedAddon {
  code: string; // Ej: 'CLADDING', 'EDGE_BANDING'
  measurements: {
    length_ml?: number;
    width_mm?: number;
    height_mm?: number; // Puedes añadir las que conozcas
    // O mejor aún, una firma de índice:
    [key: string]: number | undefined;
  };
  // Opcional: atributos propios del accesorio, si aplica
  // selectedAttributes?: SelectedAttributes;
}

export interface PieceLayout {
  // Orden visual (por si difiere del array)
  order: number;

  // Rotación en grados (0, 90, -90, 180)
  rotation: number;

  // ¿Cómo se une a la anterior?
  // 'START': Empieza donde termina la anterior (Lineal)
  // 'CORNER_LEFT': Gira a la izquierda (Forma L)
  // 'CORNER_RIGHT': Gira a la derecha
  // 'NONE': Es la pieza base (0)
  connectionType: "NONE" | "LINEAR" | "CORNER_LEFT" | "CORNER_RIGHT";

  // Tipo de Unión (Para el problema de "quién monta sobre quién")
  // 'OVERLAP': Esta pieza se "mete" en la esquina (Gana fondo)
  // 'BUTT': Esta pieza empieza DESPUÉS del fondo de la anterior
  jointType?: "OVERLAP" | "BUTT";
}

/**
 * Representa una Pieza de Encimera. Es el corazón del proyecto.
 * Un presupuesto se compone de un array de estas piezas.
 */

export interface MainPiece {
  // Identificador único temporal en el frontend
  id: string;

  // --- Datos del Material y Atributos ---
  materialId: string | null; // ID del material base (ej. "HPL RURAL")
  selectedAttributes: SelectedAttributes;

  // --- Medidas de la Pieza ---
  measurements: {
    length_mm: number;
    width_mm: number;
  };

  // Elegir forma
  layout?: PieceLayout;

  // --- Accesorios Aplicados ---
  appliedAddons: AppliedAddon[]; // Lista de accesorios para ESTA pieza
}

/**
 * Interfase para seleccionar y cambiar Material, en Step 1 y Step 2
 */
export interface MaterialConfirmationPayload {
  materialId: string;
  materialName: string;
  materialImage?: string;
  selectedAttributes: SelectedAttributes; // Reutilizamos la interfaz existente
}

/**
 * 1. DEFINICIÓN DEL ESTADO
 */
export interface QuoteState {
  mainPieces: MainPiece[];
  activePieceIndex: number | null; // Lo usaremos en Step 2, 3 y 4

  // --- NUEVO ---
  // Almacena temporalmente la selección de Step 1
  wizardTempMaterial: {
    materialId: string;
    materialName: string;
    materialImage?: string;
    selectedAttributes: SelectedAttributes;
  } | null;

  // Estados de UI
  isCalculating: boolean;
  calculationResult: any | null;
  error: string | null;
}

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
  wizardTempMaterial: null,
  isCalculating: false,
  calculationResult: null,
  error: null,
};

/**
 * Step 2, interface para los botones visuales de seleccion de forma.
 */
interface ShapeVariationPayload {
  variationCode: string; // Identifier for the chosen variation
  count: number;
  defaultMeasurements: { length_mm: number; width_mm: number }[];
  piecesLayout?: PieceLayout[];
}

/**
 * 3. DEFINICIÓN DE ACCIONES
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
  | { type: "CALCULATION_ERROR"; payload: { error: string } };

/**
 * 4. EL REDUCER (CON NUEVA LÓGICA)
 */
export const quoteReducer = (state: QuoteState, action: QuoteAction): QuoteState => {
  switch (action.type) {
    // --- ACCIÓN DE STEP 1 ---
    case "SET_WIZARD_MATERIAL": {
      const newMaterialPayload = action.payload;

      // 1. Actualizamos siempre la selección temporal (para que el UI de Step 1 se vea bien)
      const newState = {
        ...state,
        wizardTempMaterial: newMaterialPayload,
      };

      // 2. ¡LA CLAVE! Si ya existen piezas (mainPieces), debemos propagar el cambio.
      // Esto asume que si cambias el material en el Paso 1, quieres aplicarlo a todo el proyecto.
      if (state.mainPieces.length > 0) {
        newState.mainPieces = state.mainPieces.map((piece) => ({
          ...piece,
          // Sobrescribimos el material y atributos con la nueva selección
          materialId: newMaterialPayload.materialId,
          selectedAttributes: newMaterialPayload.selectedAttributes,
        }));
      }

      return newState;
    }

    // --- NUEVA ACCIÓN DE STEP 2 (Forma) ---
    case "SET_SHAPE_AND_CREATE_PIECES": {
      // Solo debe ejecutarse si no hay piezas y hay un material
      if (state.mainPieces.length > 0 || !state.wizardTempMaterial) {
        return state;
      }

      const newPieces: MainPiece[] = [];
      const { materialId, selectedAttributes } = state.wizardTempMaterial;

      for (let i = 0; i < action.payload.count; i++) {
        const newPiece = createDefaultPiece();
        newPiece.materialId = materialId; // Asigna el material
        newPiece.selectedAttributes = selectedAttributes; // Asigna los atributos
        newPieces.push(newPiece);
      }

      return {
        ...state,
        mainPieces: newPieces,
        activePieceIndex: 0, // Activamos la primera pieza
      };
    }

    // --- NUEVA ACCIÓN DE STEP 2 (Medidas) ---
    case "SET_SHAPE_VARIATION_AND_CREATE_PIECES": {
      const { count, defaultMeasurements, piecesLayout } = action.payload;

      // Safety checks (same as before)
      if (state.mainPieces.length > 0 || !state.wizardTempMaterial) {
        return state;
      }
      // Check if measurements match count
      if (defaultMeasurements.length !== count) {
        console.error("Mismatch between piece count and default measurements provided.");
        return state; // Or handle error appropriately
      }

      const newPieces: MainPiece[] = [];
      const { materialId, selectedAttributes } = state.wizardTempMaterial;

      for (let i = 0; i < count; i++) {
        const newPiece = createDefaultPiece();
        newPiece.materialId = materialId;
        newPiece.selectedAttributes = selectedAttributes;
        // --- ASSIGN DEFAULT MEASUREMENTS ---
        newPiece.measurements = defaultMeasurements[i];
        // ------------------------------------

        // INTELIGENCIA 3D
        if (piecesLayout && piecesLayout[i]) {
          newPiece.layout = piecesLayout[i];
        }

        newPieces.push(newPiece);
      }

      return {
        ...state,
        mainPieces: newPieces,
        activePieceIndex: 0, // Activate the first piece
      };
    }

    case "RESET_SHAPE":
      return {
        ...state,
        mainPieces: [], // Vacía el array de piezas
        activePieceIndex: null, // Resetea el índice activo
        // Mantenemos wizardTempMaterial por si el usuario
        // solo quiere cambiar la forma pero no el material base.
      };

    case "UPDATE_PIECE_MEASUREMENTS": {
      const { pieceIndex, measurements } = action.payload;
      return {
        ...state,
        mainPieces: state.mainPieces.map((piece, index) => {
          if (index === pieceIndex) {
            return { ...piece, measurements };
          }
          return piece;
        }),
      };
    }

    // (Antes 'UPDATE_ACTIVE_PIECE', ahora 'UPDATE_MAIN_PIECE' con índice)
    case "UPDATE_MAIN_PIECE": {
      const { pieceIndex, data } = action.payload;
      return {
        ...state,
        mainPieces: state.mainPieces.map((piece, index) => {
          if (index === pieceIndex) {
            // Creamos una copia base
            const updatedPiece = { ...piece, ...data };

            // Si la data trae selectedAttributes parciales, hacemos merge con los existentes
            // para no borrar atributos que no venían en el payload.
            if (data.selectedAttributes) {
              updatedPiece.selectedAttributes = {
                ...piece.selectedAttributes,
                ...data.selectedAttributes,
              };
            }
            return updatedPiece;
          }
          return piece;
        }),
      };
    }

    // --- Gestión de Accesorios (Addons) en la Pieza Activa ---
    case "ADD_ADDON_TO_PIECE": {
      const { pieceIndex, addon } = action.payload;
      return {
        ...state,
        mainPieces: state.mainPieces.map((piece, index) => {
          if (index === pieceIndex) {
            return { ...piece, appliedAddons: [...piece.appliedAddons, addon] };
          }
          return piece;
        }),
      };
    }

    case "REMOVE_ADDON_FROM_PIECE": {
      const { pieceIndex, addonIndex } = action.payload;
      return {
        ...state,
        mainPieces: state.mainPieces.map((piece, index) => {
          // 1. Encontrar la pieza correcta
          if (index === pieceIndex) {
            // 2. Crear un nuevo array de addons (inmutabilidad)
            //    filtrando el que queremos eliminar
            const newAddons = piece.appliedAddons.filter((_, i) => i !== addonIndex);
            // 3. Devolver la pieza actualizada
            return { ...piece, appliedAddons: newAddons };
          }
          return piece;
        }),
      };
    }

    // --- UPDATE_ADDON_IN_PIECE (STEP 3 y 4) ---
    case "UPDATE_ADDON_IN_PIECE": {
      const { pieceIndex, addonIndex, data } = action.payload;
      return {
        ...state,
        mainPieces: state.mainPieces.map((piece, index) => {
          if (index === pieceIndex) {
            const newAddons = piece.appliedAddons.map((addon, i) => {
              if (i === addonIndex) {
                // 1. Hacemos spread superficial primero
                const updatedAddon = { ...addon, ...data };

                // 2. PROTECCIÓN DE DATOS ANIDADOS:
                // Si estamos actualizando medidas, asegurarnos de hacer MERGE
                // con las medidas existentes, no reemplazarlas.
                if (data.measurements) {
                  updatedAddon.measurements = {
                    ...addon.measurements, // Mantiene length_ml si solo actualizas width_mm
                    ...data.measurements,
                  };
                }

                return updatedAddon;
              }
              return addon;
            });
            return { ...piece, appliedAddons: newAddons };
          }
          return piece;
        }),
      };
    }

    case "SET_ACTIVE_PIECE":
      return { ...state, activePieceIndex: action.payload.index };

    case "CALCULATION_START":
      return {
        ...state,
        isCalculating: true,
        calculationResult: null, // Limpia resultados anteriores
        error: null, // Limpia errores anteriores
      };

    case "CALCULATION_SUCCESS":
      return {
        ...state,
        isCalculating: false,
        calculationResult: action.payload.results, // Guarda el desglose
        error: null,
      };

    case "CALCULATION_ERROR":
      return {
        ...state,
        isCalculating: false,
        calculationResult: null,
        error: action.payload.error, // Guarda el mensaje de error
      };

    default:
      return state;
  }
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
