// config/measurements.ts

import type { MeasurementKey, MeasurementOption } from "@/types/measurements";

// Usamos un Record para acceso directo por ID (sin hacer .find en arrays)
export const MEASUREMENT_CONFIG: Record<MeasurementKey, MeasurementOption> = {
  quantity: {
    value: "quantity",
    label: "Cantidad (Unidades)",
    description: "Número total de unidades requeridas para este ítem.",
    inputConfig: { min: 1, step: 1, defaultWidth: 90 },
  },
  length_ml: {
    value: "length_ml",
    label: "Largo (ml)",
    description: "Largo del material utilizado en metros lineales, por ejemplo para COPETES.",
    inputConfig: { min: 1, step: 0.1, defaultWidth: 90 },
  },
  width_mm: {
    value: "width_mm",
    label: "Ancho (mm)",
    description: "Ancho total medido en milímetros.",
    inputConfig: { min: 1, step: 1, defaultWidth: 90 },
  },
  height_mm: {
    value: "height_mm",
    label: "Alto (mm)",
    description: "Altura / Fondo medido en milímetros, usado para saber el alto del COPETE, o el Fondo de los TRABAJO, ej ENCASTRE.",
    inputConfig: { min: 1, step: 1, defaultWidth: 90 },
  },
  radio_mm: {
    value: "radio_mm",
    label: "Radio (mm)",
    description: "Medida del radio para los redondeos.",
    inputConfig: { min: 1, step: 1, defaultWidth: 90 },
  },
};

// Helper derivado: Array para iterar en el Select (Menú)
export const MEASUREMENT_OPTIONS_LIST = Object.values(MEASUREMENT_CONFIG);

// Helper function (opcional, pero útil si la lógica se complica)
export const getMeasurementInfo = (key: string): MeasurementOption | undefined => {
  return MEASUREMENT_CONFIG[key as MeasurementKey];
};
