// src/pages/public/steps/Step2_ShapeAndMeasurements.tsx
import React from "react";
import { Box, Typography, TextField, ToggleButtonGroup, ToggleButton, Grid, Button } from "@mui/material";
import { useQuoteState, useQuoteDispatch } from "../../../context/QuoteContext";

// 1. Definimos las props que el componente recibirá del Wizard
interface StepProps {
  onNext: () => void;
  onBack: () => void;
}

const Step2_ShapeAndMeasurements: React.FC<StepProps> = ({ onNext, onBack }) => {
  const { shape, measurements } = useQuoteState();
  const dispatch = useQuoteDispatch();

  const handleShapeChange = (event: React.MouseEvent<HTMLElement>, newShape: "Lineal" | "L" | "U" | null) => {
    if (newShape) {
      dispatch({ type: "SET_SHAPE_AND_MEASUREMENTS", payload: { shape: newShape } });
    }
  };

  const handleMeasurementChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    dispatch({
      type: "SET_SHAPE_AND_MEASUREMENTS",
      payload: { [name]: Number(value) || undefined },
    });
  };

  // 2. Lógica para validar si el paso está completo
  const isStepComplete = (): boolean => {
    if (!shape) return false;
    const { fondo, ladoA, ladoB, ladoC } = measurements;
    switch (shape) {
      case "Lineal":
        return !!(fondo && ladoA && fondo > 0 && ladoA > 0);
      case "L":
        return !!(fondo && ladoA && ladoB && fondo > 0 && ladoA > 0 && ladoB > 0);
      case "U":
        return !!(fondo && ladoA && ladoB && ladoC && fondo > 0 && ladoA > 0 && ladoB > 0 && ladoC > 0);
      default:
        return false;
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Paso 2: Forma y Medidas
      </Typography>
      <Typography sx={{ mb: 2 }}>Selecciona la forma de tu encimera e introduce las medidas en milímetros (mm).</Typography>

      {/* ... (ToggleButtonGroup y Grid con los TextFields sin cambios) ... */}
      <ToggleButtonGroup value={shape} exclusive onChange={handleShapeChange} aria-label="forma de la encimera" fullWidth sx={{ mb: 3 }}>
        <ToggleButton value="Lineal" aria-label="lineal">
          Lineal
        </ToggleButton>
        <ToggleButton value="L" aria-label="en L">
          En L
        </ToggleButton>
        <ToggleButton value="U" aria-label="en U">
          En U
        </ToggleButton>
      </ToggleButtonGroup>

      {shape && (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField name="fondo" label="Fondo (mm)" type="number" fullWidth required value={measurements.fondo || ""} onChange={handleMeasurementChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="ladoA"
              label={shape === "Lineal" ? "Largo (mm)" : "Lado A (mm)"}
              type="number"
              fullWidth
              required
              value={measurements.ladoA || ""}
              onChange={handleMeasurementChange}
            />
          </Grid>

          {shape === "L" && (
            <Grid item xs={12} sm={6}>
              <TextField name="ladoB" label="Lado B (mm)" type="number" fullWidth required value={measurements.ladoB || ""} onChange={handleMeasurementChange} />
            </Grid>
          )}

          {shape === "U" && (
            <>
              <Grid item xs={12} sm={6}>
                <TextField name="ladoB" label="Lado B (mm)" type="number" fullWidth required value={measurements.ladoB || ""} onChange={handleMeasurementChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField name="ladoC" label="Lado C (mm)" type="number" fullWidth required value={measurements.ladoC || ""} onChange={handleMeasurementChange} />
              </Grid>
            </>
          )}
          <Grid item xs={12} sm={6}>
            <TextField name="copete" label="Metros lineales de Copete (Opcional)" type="number" fullWidth value={measurements.copete || ""} onChange={handleMeasurementChange} />
          </Grid>
        </Grid>
      )}

      {/* 3. Añadimos los botones de navegación */}
      <Box sx={{ mt: 4, display: "flex", justifyContent: "space-between" }}>
        <Button onClick={onBack}>Atrás</Button>
        <Button variant="contained" onClick={onNext} disabled={!isStepComplete()}>
          Siguiente
        </Button>
      </Box>
    </Box>
  );
};

export default Step2_ShapeAndMeasurements;
