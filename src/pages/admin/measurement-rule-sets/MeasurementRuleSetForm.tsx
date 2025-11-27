// src/components/admin/measurement-rule-sets/MeasurementRuleSetForm.tsx
import React from "react";
import { Box, Button, TextField, Select, MenuItem, InputLabel, FormControl, Typography, Paper, IconButton, type SelectChangeEvent } from "@mui/material";
import Grid from "@mui/material/Grid";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

// 1. Importamos las interfaces que definimos en Fase 1
import type { MeasurementRuleSet, MeasurementRange } from "../../../interfases/measurement-rule-set.interfase";

// --- 2. Definimos todas las props que el formulario necesita ---
interface MeasurementRuleSetFormProps {
  // El estado actual (del modal)
  currentRuleSet: Partial<MeasurementRuleSet>;
  isEditMode: boolean;

  // Los handlers (del modal)
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  handleTextChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  // Handlers para el array dinámico de 'ranges'
  handleRangeChange: (index: number, field: keyof MeasurementRange, value: string | number) => void;
  handleAddRange: () => void;
  handleRemoveRange: (index: number) => void;
}

const MeasurementRuleSetForm: React.FC<MeasurementRuleSetFormProps> = ({
  currentRuleSet,
  isEditMode,
  handleSubmit,
  handleTextChange,
  handleRangeChange,
  handleAddRange,
  handleRemoveRange,
}) => {
  return (
    // --- 3. El <form> que llama al handleSubmit del modal ---
    <Box component="form" id="ruleset-form" onSubmit={handleSubmit}>
      {/* --- SECCIÓN 1: CAMPOS BASE --- */}
      <Typography variant="h6" gutterBottom>
        Información Base
      </Typography>
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 8 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              name="name"
              label="Nombre del Set de Reglas"
              value={currentRuleSet.name || ""}
              onChange={handleTextChange}
              helperText="Ej: Regla Copete HPL, Regla Paneles 19mm"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              name="unit"
              label="Unidad de Medida"
              value={currentRuleSet.unit || "mm"} // 'mm' por defecto
              onChange={handleTextChange}
              helperText="Ej: mm, cm, etc."
            />
          </Grid>
        </Grid>
      </Paper>

      {/* --- SECCIÓN 2: EDITOR DINÁMICO DE RANGOS --- */}
      <Typography variant="h6" gutterBottom>
        Rangos de Medición
      </Typography>
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        {/* 4. Mapeamos el array 'ranges' del estado */}
        {(currentRuleSet.ranges || []).map((range, index) => (
          <Paper key={index} elevation={2} sx={{ p: 2, mb: 2, position: "relative", borderLeft: "3px solid", borderColor: "primary.main" }}>
            <Typography variant="caption" sx={{ fontWeight: "bold" }}>
              Rango {index + 1}
            </Typography>
            <IconButton size="small" onClick={() => handleRemoveRange(index)} sx={{ position: "absolute", top: 8, right: 8 }}>
              <DeleteIcon />
            </IconButton>

            {/* 5. Sub-formulario para cada rango */}
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  label="Etiqueta (Label)"
                  value={range.label}
                  // Usamos el handler con el índice y el nombre del campo
                  onChange={(e) => handleRangeChange(index, "label", e.target.value)}
                  size="small"
                  helperText="Ej: ESTANDAR_50"
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField
                  fullWidth
                  required
                  label="Min"
                  type="number"
                  value={range.min}
                  onChange={(e) => handleRangeChange(index, "min", parseFloat(e.target.value))}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField
                  fullWidth
                  required
                  label="Max"
                  type="number"
                  value={range.max}
                  onChange={(e) => handleRangeChange(index, "max", parseFloat(e.target.value))}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth size="small" required>
                  <InputLabel>Tipo de Precio</InputLabel>
                  <Select label="Tipo de Precio" value={range.priceType} onChange={(e: SelectChangeEvent<string>) => handleRangeChange(index, "priceType", e.target.value)}>
                    <MenuItem value="ml">ml (Metro Lineal)</MenuItem>
                    <MenuItem value="m2">m2 (Metro Cuadrado)</MenuItem>
                    <MenuItem value="piece">piece (Por Pieza)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>
        ))}

        {/* 6. Botón para añadir un nuevo rango */}
        <Button startIcon={<AddCircleOutlineIcon />} onClick={handleAddRange} variant="outlined">
          Añadir Rango
        </Button>
      </Paper>

      {/* --- 7. Botón de Guardar (envía el formulario) --- */}
      <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
        {isEditMode ? "Guardar Cambios" : "Crear Set de Reglas"}
      </Button>
    </Box>
  );
};

export default MeasurementRuleSetForm;
