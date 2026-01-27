import type { QuoteAction } from "./QuoteActions";
import { createDefaultPiece } from "./QuoteContext";
import type { MainPiece, QuoteState } from "./QuoteInterfases";

/**
 * EL REDUCER (CON NUEVA LÓGICA)
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
      const { count, defaultMeasurements, piecesLayout, variationCode } = action.payload;

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
        selectedShapeId: variationCode,
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
