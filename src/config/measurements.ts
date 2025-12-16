// config/measurements.ts

import type { MeasurementKey, MeasurementOption } from "@/types/measurements";

// Usamos un Record para acceso directo por ID (sin hacer .find en arrays)
export const MEASUREMENT_CONFIG: Record<MeasurementKey, MeasurementOption> = {
  quantity: {
    value: "quantity",
    label: "Cantidad (Unidades)",
    description: "Número total de unidades requeridas para este ítem.",
  },
  length_ml: {
    value: "length_ml",
    label: "Largo (ml)",
    description: "Largo del material utilizado en metros lineales, por ejemplo para COPETES.",
  },
  width_mm: {
    value: "width_mm",
    label: "Ancho (mm)",
    description: "Ancho total medido en milímetros.",
  },
  height_mm: {
    value: "height_mm",
    label: "Alto (mm)",
    description: "Altura / Fondo, usado para saber el alto del COPETE, o el Fondo de los TRABAJO, ej ENCASTRE.",
  },
  radio_mm: {
    value: "radio_mm",
    label: "Radio (mm)",
    description: "Medida del radio para los redondeos.",
  },
};

// Helper derivado: Array para iterar en el Select (Menú)
export const MEASUREMENT_OPTIONS_LIST = Object.values(MEASUREMENT_CONFIG);

// Helper function (opcional, pero útil si la lógica se complica)
export const getMeasurementInfo = (key: string): MeasurementOption | undefined => {
  return MEASUREMENT_CONFIG[key as MeasurementKey];
};
