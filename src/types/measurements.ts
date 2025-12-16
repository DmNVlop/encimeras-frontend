// types/measurements.ts

export type MeasurementKey = "quantity" | "length_ml" | "width_mm" | "height_mm" | "radio_mm";

export interface MeasurementOption {
  value: MeasurementKey;
  label: string;
  description: string; // La descripción larga para tooltips y UI
  shortLabel?: string; // Opcional: si necesitas una versión muy corta para el Chip
}
