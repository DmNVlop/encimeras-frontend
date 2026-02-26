// d:\Proyectos\DEV\presupuesto-encimeras\frontend\src\utils\coreMapper.ts
import type { QuoteState, MainPiece } from "../context/QuoteInterfases";
import type { CoreEntityDto, MainPieceDto, UIStateDto } from "../interfases/core.interfase";

/**
 * Mapea una pieza del estado del frontend al DTO estricto del core.
 */
export const mapPieceToCoreDto = (piece: MainPiece): MainPieceDto => {
  return {
    materialId: piece.materialId || "",
    length_mm: piece.measurements.length_mm,
    width_mm: piece.measurements.width_mm,
    selectedAttributes: piece.selectedAttributes,
    appliedAddons: piece.appliedAddons.map((addon) => ({
      ...addon,
      // Aseguramos que los Measurements se envíen correctamente si el backend espera algo específico
    })),
  };
};

/**
 * Genera el objeto CoreEntityDto para enviar al backend.
 */
export const mapStateToCoreDto = (state: QuoteState): CoreEntityDto => {
  return {
    mainPieces: state.mainPieces.map(mapPieceToCoreDto),
    // factoryId: state.factoryId, // Si tuviéramos factoryId en el state
  };
};

/**
 * Genera el objeto UIState para persistir metadatos visuales.
 * Guardamos aquí el estado completo para una restauración 1:1 sin dependencias del motor de cálculo.
 */
export const mapStateToUiState = (state: QuoteState): UIStateDto => {
  return {
    wizardTempMaterial: state.wizardTempMaterial,
    selectedShapeId: state.selectedShapeId,
    mainPieces: state.mainPieces, // Guardamos las piezas originales (con sus IDs de frontend)
    activePieceIndex: state.activePieceIndex,
  };
};

/**
 * Reconstruye el estado parcial del Wizard a partir de un borrador o ítem del carrito.
 * Prioriza uiState para la experiencia de usuario, pero podría usar core si uiState no existe (compatibilidad).
 */
export const mapBackendDataToState = (data: any): Partial<QuoteState> => {
  if (!data) {
    return {
      mainPieces: [],
      wizardTempMaterial: null,
      selectedShapeId: null,
      activePieceIndex: null,
    };
  }
  const uiState = data.uiState || {};
  const core = data.core || {};

  // Si no hay uiState pero hay core (migración), intentamos reconstruir
  const mainPieces =
    uiState.mainPieces ||
    core.mainPieces?.map((p: any) => ({
      id: `piece_${Date.now()}_${Math.random()}`,
      materialId: p.materialId,
      selectedAttributes: p.selectedAttributes,
      measurements: {
        length_mm: p.length_mm,
        width_mm: p.width_mm,
      },
      appliedAddons: p.appliedAddons || [],
    })) ||
    [];

  return {
    mainPieces,
    wizardTempMaterial: uiState.wizardTempMaterial || null,
    selectedShapeId: uiState.selectedShapeId || null,
    activePieceIndex: uiState.activePieceIndex ?? (mainPieces.length > 0 ? 0 : null),
  };
};
