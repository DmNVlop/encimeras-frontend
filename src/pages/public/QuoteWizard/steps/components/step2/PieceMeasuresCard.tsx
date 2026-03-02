import React from "react";
import { Box, Typography, Paper, Grid, Button, TextField } from "@mui/material";
import EncimeraPreview from "@/pages/public/common/EncimeraPreview/encimera-preview";
import { selectOnFocus } from "@/utils/form.utils";
import type { MainPiece } from "@/context/QuoteInterfases";
import type { ShapeVariation } from "@/interfases/shape-variation.interfase";

interface PieceMeasuresCardProps {
  index: number;
  piece: MainPiece;
  materialName: string;
  currentShapeVariation: ShapeVariation | undefined;
  handleOpenChangeMaterialModal: (index: number) => void;
  handleMeasureChange: (pieceIndex: number, field: "length_mm" | "width_mm", value: string) => void;
}

export const PieceMeasuresCard: React.FC<PieceMeasuresCardProps> = ({
  index,
  piece,
  materialName,
  currentShapeVariation,
  handleOpenChangeMaterialModal,
  handleMeasureChange,
}) => {
  return (
    <Paper elevation={2} sx={{ p: 0, overflow: "hidden", height: "100%" }}>
      <Grid container sx={{ height: "100%" }}>
        {/* COLUMNA IZQUIERDA: Inputs y Datos */}
        <Grid size={{ xs: 12, md: 8 }} sx={{ p: 3 }}>
          <Typography variant="h6" component="div" gutterBottom sx={{ fontWeight: "bold" }}>
            Pieza {index + 1}
          </Typography>

          {/* Info del material con botón de cambiar */}
          <Box
            sx={{
              mb: 2,
              p: 1.5,
              backgroundColor: "#f9f9f9",
              borderRadius: 1,
              border: "1px solid #eee",
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
              {materialName}
            </Typography>
            <Button size="small" variant="text" onClick={() => handleOpenChangeMaterialModal(index)} sx={{ p: 0, mt: 0.5, textTransform: "none" }}>
              Cambiar material de esta pieza
            </Button>
          </Box>

          {/* Inputs de Medidas */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Largo (mm)"
                name="length_mm"
                type="number"
                value={piece.measurements.length_mm}
                onChange={(e) => handleMeasureChange(index, "length_mm", e.target.value)}
                onFocus={selectOnFocus}
                variant="outlined"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Ancho (mm)"
                name="width_mm"
                type="number"
                value={piece.measurements.width_mm}
                onChange={(e) => handleMeasureChange(index, "width_mm", e.target.value)}
                onFocus={selectOnFocus}
                variant="outlined"
              />
            </Grid>
          </Grid>
        </Grid>

        {/* COLUMNA DERECHA: Visualización Contextual */}
        <Grid
          size={{ xs: 12, md: 4 }}
          sx={{
            backgroundColor: "#f4f6f8",
            borderLeft: { md: "1px solid #e0e0e0" },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            p: 2,
          }}
        >
          {currentShapeVariation ? (
            <Box sx={{ width: "100%", textAlign: "center" }}>
              <EncimeraPreview
                config={{
                  id: currentShapeVariation.id,
                  name: currentShapeVariation.name,
                  grid: currentShapeVariation.grid,
                  pieces: currentShapeVariation.pieces,
                }}
                highlightIndex={index}
              />
              <Typography variant="caption" align="center" display="block" sx={{ mt: 1, color: "text.secondary", fontWeight: "medium" }}>
                Editando zona resaltada
              </Typography>
            </Box>
          ) : (
            <Typography variant="caption" color="text.secondary">
              Forma no visualizable
            </Typography>
          )}
        </Grid>
      </Grid>
    </Paper>
  );
};
