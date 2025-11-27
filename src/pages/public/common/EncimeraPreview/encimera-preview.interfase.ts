// =============================================================================
// INTERFACES DE TIPOS
// =============================================================================

/**
 * Define la estructura de una única pieza de la encimera.
 */
export interface EncimeraPreviewPiece {
    id: string;
    area: string;
    borderRadius?: string;
}

/**
 * Define la estructura de la cuadrícula (el lienzo).
 */
export interface EncimeraGrid {
    columns: string;
    rows: string;
    aspectRatio?: string;
}

/**
 * Define la configuración completa que espera el componente.
 * Esta es la API de props principal.
 */
export interface EncimeraPreviewConfig {
    id: string;
    name: string; // Basado en tu mock simplificado
    grid: EncimeraGrid;
    pieces: EncimeraPreviewPiece[];
}

/**
 * Define las props que recibe el componente React.
 */
export interface EncimeraPreviewProps {
    /**
     * El objeto de configuración que define la forma de la encimera.
     * Puede ser null si aún no hay datos.
     */
    config: EncimeraPreviewConfig | null;
}