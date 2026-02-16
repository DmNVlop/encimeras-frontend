import type { MainPiece } from "@/context/QuoteInterfases";

/**
 * Valida que todas las uniones entre piezas tengan un ensamblaje seleccionado.
 *
 * Regla:
 * Si hay N piezas, debe haber N-1 uniones.
 * La unión i (0-based) conecta Pieza i con Pieza i+1.
 * La información de la unión se guarda en la Pieza i+1 (targetPiece).
 * Debe existir un addon con category === 'ENSAMBLAJE' en targetPiece.
 */
export const validateAssemblies = (mainPieces: MainPiece[]): { isValid: boolean; error?: string } => {
  if (mainPieces.length <= 1) {
    return { isValid: true };
  }

  // Iteramos desde la segunda pieza (índice 1) hasta la última
  for (let i = 1; i < mainPieces.length; i++) {
    const targetPiece = mainPieces[i];

    // Busamos si tiene algún addon de tipo ensamblaje
    const hasAssembly = targetPiece.appliedAddons.some((addon) => addon.category === "ENSAMBLAJE");

    if (!hasAssembly) {
      // Como el índice es 0-based, la unión 0 es entre P1 y P2.
      // Si falla en i=1 (Pieza 2), es la Unión 1.
      return {
        isValid: false,
        error: `Falta seleccionar el tipo de unión para la Unión ${i} (Pieza ${i} y Pieza ${i + 1}).`,
      };
    }
  }

  return { isValid: true };
};
