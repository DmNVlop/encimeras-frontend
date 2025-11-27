// src/interfases/measurement-rule-set.interfase.ts

/**
 * Define la estructura de un rango de medida anidado
 *
 */
export interface MeasurementRange {
    label: string; // ej. 'ESTANDAR_50'
    min: number;
    max: number;
    priceType: 'ml' | 'm2' | 'piece';
}

/**
 * Define la estructura del documento principal
 *
 */
export interface MeasurementRuleSet {
    _id: string; // Añadido por Mongoose
    id?: string;  // Lo usaremos para el DataGrid (mapeado de _id)
    name: string; // ej. 'Reglas Ancho Copete HPL/ML'
    unit: string; // ej. 'mm'
    ranges: MeasurementRange[];
}
