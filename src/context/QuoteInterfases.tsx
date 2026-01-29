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

  selectedShapeId: string | null; // Guardará el ID de la forma (variationCode)

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
  currentDraftId: string | null; // NULL = Nuevo proyecto, STRING = Editando borrador
  isDraftRecalculated: boolean; // Para mostrar alertas si el precio cambió al cargar
}

/**
 * Step 2, interface para los botones visuales de seleccion de forma.
 */
export interface ShapeVariationPayload {
  variationCode: string; // Identifier for the chosen variation
  count: number;
  defaultMeasurements: { length_mm: number; width_mm: number }[];
  piecesLayout?: PieceLayout[];
}
