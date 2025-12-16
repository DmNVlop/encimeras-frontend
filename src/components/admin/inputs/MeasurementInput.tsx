// components/inputs/MeasurementInput.tsx
import React from "react";
import { TextField } from "@mui/material";
import { MEASUREMENT_CONFIG } from "@/config/measurements";
import { type MeasurementKey } from "@/types/measurements";

interface MeasurementInputProps {
  fieldKey: string; // Recibimos string, validamos dentro
  value: string | number | undefined;
  onChange: (field: MeasurementKey, newValue: string) => void;
}

export const MeasurementInput: React.FC<MeasurementInputProps> = ({ fieldKey, value, onChange }) => {
  // 1. Safety Check & Config Retrieval
  // Forzamos el cast porque confiamos en que los datos vienen limpios,
  // si no, fallback a una config genérica.
  const config = MEASUREMENT_CONFIG[fieldKey as MeasurementKey];

  if (!config) {
    console.warn(`Measurement configuration not found for key: ${fieldKey}`);
    return null;
  }

  const { label, inputConfig, description } = config;

  // 2. Lógica de Validación Centralizada
  const numValue = parseFloat(value?.toString() || "0");

  // La regla de negocio dice: Es inválido si está vacío, es NaN, o es menor al mínimo permitido
  const isInvalid = !value || isNaN(numValue) || numValue < inputConfig.min;

  // 3. Handler Interno
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Aquí podrías agregar más sanitización si fuera necesario antes de subir el evento
    onChange(fieldKey as MeasurementKey, e.target.value);
  };

  return (
    <TextField
      label={label}
      value={value || ""}
      onChange={handleChange}
      type="number"
      size="small"
      variant="outlined"
      title={description}
      // Feedback Visual
      error={isInvalid}
      helperText={isInvalid ? "Requerido" : ""}
      // Estilos controlados por config
      sx={{ width: inputConfig.defaultWidth }}
      // Props modernas (MUI v5/v6 ready)
      slotProps={{
        htmlInput: {
          min: inputConfig.min,
          step: inputConfig.step,
        },
      }}
    />
  );
};
