import React from "react";
import { Paper, Grid, Box, Typography, Avatar } from "@mui/material";
import EncimeraPreview from "@/pages/public/common/EncimeraPreview/encimera-preview";
import { shapeVariations } from "@/pages/public/common/shapes-step2";

interface ProjectGlobalSummaryProps {
  wizardTempMaterial: any;
  selectedShapeId: string | null;
  mainPiecesCount: number;
}

export const ProjectGlobalSummary: React.FC<ProjectGlobalSummaryProps> = ({ wizardTempMaterial, selectedShapeId, mainPiecesCount }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        mb: 4,
        p: 2.5,
        borderRadius: 3,
        bgcolor: (theme) => (theme.palette.mode === "dark" ? "rgba(25, 118, 210, 0.08)" : "rgba(25, 118, 210, 0.04)"),
        border: "1px dashed",
        borderColor: "primary.light",
      }}
    >
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: "bold", textTransform: "uppercase", display: "block", mb: 0.5 }}>
            Material Principal
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar src={wizardTempMaterial?.materialImage} sx={{ width: 24, height: 24 }} />
            <Typography variant="body1" fontWeight="800">
              {wizardTempMaterial?.materialName}
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: "bold", textTransform: "uppercase", display: "block", mb: 0.5 }}>
            Forma de Encimera
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {selectedShapeId && (
              <Box
                sx={{
                  width: 50,
                  height: 30,
                  bgcolor: "background.paper",
                  borderRadius: 1,
                  border: "1px solid #e0e0e0",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  "& .encimera-preview-container": {
                    minHeight: "unset",
                    height: "100%",
                    width: "100%",
                    p: 0.5,
                  },
                  "& .encimera-pieza": {
                    backgroundSize: "8px 8px",
                  },
                }}
              >
                <EncimeraPreview
                  config={{
                    id: selectedShapeId,
                    name: shapeVariations.find((s: any) => s.id === selectedShapeId)?.name || "",
                    grid: shapeVariations.find((s: any) => s.id === selectedShapeId)?.grid || {
                      columns: "",
                      rows: "",
                    },
                    pieces: shapeVariations.find((s: any) => s.id === selectedShapeId)?.pieces || [],
                  }}
                />
              </Box>
            )}
            <Typography variant="body1" fontWeight="800">
              {shapeVariations.find((s: any) => s.id === selectedShapeId)?.name || "Configuración Personalizada"}
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: "bold", textTransform: "uppercase", display: "block", mb: 0.5 }}>
            Número de Piezas
          </Typography>
          <Typography variant="body1" fontWeight="800">
            {mainPiecesCount} {mainPiecesCount === 1 ? "Pieza" : "Piezas"}
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  );
};
