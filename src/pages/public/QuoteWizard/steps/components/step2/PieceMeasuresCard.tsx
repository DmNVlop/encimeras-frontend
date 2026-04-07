import React from "react";
import { Box, Typography, Paper, Grid, Button, TextField, Select, MenuItem, FormControl, InputLabel, IconButton } from "@mui/material";
import EncimeraPreview from "@/pages/public/common/EncimeraPreview/encimera-preview";
import { selectOnFocus } from "@/utils/form.utils";
import type { MainPiece } from "@/context/QuoteInterfases";
import type { ShapeVariation } from "@/interfases/shape-variation.interfase";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import DeleteIcon from "@mui/icons-material/Delete";
import { ConnectionTypeIcon, connectionTypeLabels, type ConnectionType } from "@/pages/public/common/Icons/ConnectionTypeIcons";

interface PieceMeasuresCardProps {
  index: number;
  piece: MainPiece;
  materialName: string;
  currentShapeVariation: ShapeVariation | undefined;
  handleOpenChangeMaterialModal: (index: number) => void;
  handleMeasureChange: (pieceIndex: number, field: "length_mm" | "width_mm", value: string) => void;
  handleRemovePiece: (index: number) => void;
  handleReorderPiece: (fromIndex: number, toIndex: number) => void;
  handleConnectionTypeChange: (pieceIndex: number, connectionType: ConnectionType) => void;
  isFirst: boolean;
  isLast: boolean;
}

export const PieceMeasuresCard: React.FC<PieceMeasuresCardProps> = ({
  index,
  piece,
  materialName,
  currentShapeVariation,
  handleOpenChangeMaterialModal,
  handleMeasureChange,
  handleRemovePiece,
  handleReorderPiece,
  handleConnectionTypeChange,
  isFirst,
  isLast,
}) => {
  const currentConnectionType = piece.layout?.connectionType || "NONE";

  const connectionTypeOptions: ConnectionType[] = ["LINEAR", "CORNER_LEFT", "CORNER_RIGHT", "NONE"];

  return (
    <Paper elevation={2} sx={{ p: 0, overflow: "hidden", height: "100%" }}>
      <Grid container sx={{ height: "100%" }}>
        <Grid size={{ xs: 12, md: 8 }} sx={{ p: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: "bold" }}>
              Pieza {index + 1}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <IconButton size="small" onClick={() => handleReorderPiece(index, index - 1)} disabled={isFirst} title="Subir">
                <ArrowUpwardIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => handleReorderPiece(index, index + 1)} disabled={isLast} title="Bajar">
                <ArrowDownwardIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => handleRemovePiece(index)} color="error" title="Eliminar">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

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

          {!isFirst && (
            <Box sx={{ mt: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Conexión con pieza anterior</InputLabel>
                <Select
                  value={currentConnectionType}
                  label="Conexión con pieza anterior"
                  onChange={(e) => handleConnectionTypeChange(index, e.target.value as ConnectionType)}
                >
                  {connectionTypeOptions.map((ct) => (
                    <MenuItem key={ct} value={ct}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <ConnectionTypeIcon type={ct} sx={{ fontSize: 24 }} />
                        <span>{connectionTypeLabels[ct]}</span>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </Grid>

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
