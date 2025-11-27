// frontend/src/components/wizard/common/AddonManagerSection.tsx
import React from "react";
import { Box, Typography, Paper, Grid, TextField, IconButton, Button, Alert } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

import type { Addon } from "../../../interfases/addon.interfase";
import type { MainPiece } from "../../../context/QuoteContext";

// Helper para etiquetas
const measurementLabels: { [key: string]: string } = {
  quantity: "Cantidad",
  length_ml: "Largo (ml)",
  width_mm: "Ancho (mm)",
};

interface AddonManagerSectionProps {
  title: string;
  availableAddons: Addon[]; // La lista completa de ese tipo (ej. todos los TRABAJOS)
  piece: MainPiece; // La pieza actual
  pieceIndex: number;
  materialCategory: string; // La categoría del material de ESTA pieza (ej. 'HPL')

  // Funciones manejadoras que vienen del padre
  onAdd: (pieceIndex: number, addon: Addon) => void;
  onRemove: (pieceIndex: number, addonIndex: number) => void;
  onUpdateMeasurement: (pieceIndex: number, addonIndex: number, field: string, value: string) => void;
}

export const AddonManagerSection: React.FC<AddonManagerSectionProps> = ({
  title,
  availableAddons,
  piece,
  pieceIndex,
  materialCategory,
  onAdd,
  onRemove,
  onUpdateMeasurement,
}) => {
  // 1. Seguridad: Si no hay categoría de material, no podemos filtrar
  if (!materialCategory) {
    return <Alert severity="warning">No se ha podido determinar el material de esta pieza.</Alert>;
  }

  // 2. Filtros
  // A. Addons compatibles con el material actual
  const compatibleAddons = availableAddons.filter((addon) => addon.allowedMaterialCategories.includes(materialCategory));

  // B. Identificar cuáles de los compatibles YA están aplicados en la pieza
  // Mapeamos para guardar el índice real dentro del array appliedAddons de la pieza
  const appliedInThisSection = piece.appliedAddons
    .map((pa, index) => ({ ...pa, originalIndex: index }))
    .filter((pa) => compatibleAddons.some((a) => a.code === pa.code));

  // C. Identificar cuáles faltan por añadir (para mostrar botones)
  // (Asumimos que solo se puede añadir 1 vez cada tipo de addon por pieza)
  const notAppliedYet = compatibleAddons.filter((addon) => !piece.appliedAddons.some((pa) => pa.code === addon.code));

  return (
    <Box sx={{ my: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ color: "primary.main", fontWeight: "medium" }}>
        {title}
      </Typography>

      {/* --- LISTA DE APLICADOS --- */}
      {appliedInThisSection.length > 0 ? (
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {appliedInThisSection.map((appliedItem) => {
            // Buscamos la definición completa para saber nombre y qué inputs pide
            const definition = compatibleAddons.find((a) => a.code === appliedItem.code)!;

            return (
              <Grid size={{ xs: 12, md: 6 }} key={appliedItem.originalIndex}>
                <Paper variant="outlined" sx={{ p: 2, position: "relative", backgroundColor: "#fcfcfc" }}>
                  {/* Cabecera de la Card */}
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                      {definition.name}
                    </Typography>
                    <IconButton size="small" color="error" onClick={() => onRemove(pieceIndex, appliedItem.originalIndex)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  {/* Inputs Dinámicos */}
                  <Grid container spacing={2}>
                    {definition.requiredMeasurements.length === 0 ? (
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="caption" color="textSecondary">
                          Sin medidas extra.
                        </Typography>
                      </Grid>
                    ) : (
                      definition.requiredMeasurements.map((field) => (
                        <Grid size={{ xs: 6 }} key={field}>
                          <TextField
                            fullWidth
                            size="small"
                            label={measurementLabels[field] || field}
                            type="number"
                            value={appliedItem.measurements[field] || ""}
                            onChange={(e) => onUpdateMeasurement(pieceIndex, appliedItem.originalIndex, field, e.target.value)}
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                      ))
                    )}
                  </Grid>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: "italic" }}>
          No hay elementos seleccionados en esta sección.
        </Typography>
      )}

      {/* --- BOTONES PARA AÑADIR --- */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {notAppliedYet.map((addon) => (
          <Button key={addon._id} variant="outlined" size="small" startIcon={<AddCircleOutlineIcon />} onClick={() => onAdd(pieceIndex, addon)}>
            {addon.name}
          </Button>
        ))}
        {notAppliedYet.length === 0 && compatibleAddons.length > 0 && (
          <Typography variant="caption" color="text.secondary">
            Has añadido todas las opciones disponibles para este material.
          </Typography>
        )}
      </Box>
    </Box>
  );
};
