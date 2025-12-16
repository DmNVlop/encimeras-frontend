import React from "react";
import { Box, Typography, Avatar, useTheme, Chip, Divider, Tooltip, Zoom } from "@mui/material";

// Iconos
import ConstructionIcon from "@mui/icons-material/Construction";
import StyleIcon from "@mui/icons-material/Style";
import StraightenIcon from "@mui/icons-material/Straighten";
import CheckCircleIcon from "@mui/icons-material/CheckCircle"; // Icono para el seleccionado

// --- IMPORTACIONES ---
import { useQuoteState } from "@/context/QuoteContext";
import type { Material } from "@/interfases/materials.interfase";
import { Card, CardActionArea } from "@mui/material";

// =============================================================================
// 1. COMPONENTE SELECTOR DE PIEZAS (Rich Tabs)
// =============================================================================

interface ProjectPiecesSelectorProps {
  materialsMap: Record<string, Material>;
  activeIndex: number;
  onPieceSelect: (index: number) => void;
}

export const ProjectPiecesSelector: React.FC<ProjectPiecesSelectorProps> = ({ materialsMap, activeIndex, onPieceSelect }) => {
  const { mainPieces } = useQuoteState();
  const theme = useTheme();

  if (!mainPieces || mainPieces.length === 0) return null;

  return (
    <Box sx={{ width: "100%", mb: 3 }}>
      <Typography variant="caption" color="text.secondary" fontWeight="bold" sx={{ mb: 1, display: "block", textTransform: "uppercase" }}>
        SELECCIONA UNA PIEZA PARA AÑADIR TRABAJOS ({mainPieces.length})
      </Typography>

      {/* Contenedor Scrollable */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          overflowX: "auto",
          pb: 2, // Espacio para la sombra y scrollbar
          px: 1, // Padding lateral para que no se corte la sombra del primero
          "&::-webkit-scrollbar": { height: 6 },
          "&::-webkit-scrollbar-thumb": { backgroundColor: theme.palette.grey[300], borderRadius: 4 },
        }}
      >
        {mainPieces.map((piece, idx) => {
          const material = piece.materialId ? materialsMap[piece.materialId] : null;
          const isSelected = activeIndex === idx;

          return (
            <Card
              key={piece.id}
              elevation={isSelected ? 8 : 1}
              sx={{
                minWidth: 220,
                maxWidth: 240,
                flexShrink: 0,
                position: "relative",
                borderRadius: 3,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                border: isSelected ? `2px solid ${theme.palette.primary.main}` : "1px solid transparent",
                transform: isSelected ? "translateY(-4px)" : "none",
                backgroundColor: isSelected ? "#fff" : "#f9f9f9",
              }}
            >
              <CardActionArea
                onClick={() => onPieceSelect(idx)}
                sx={{ height: "100%", p: 1.5, display: "flex", flexDirection: "column", alignItems: "stretch", justifyContent: "flex-start" }}
              >
                {/* Header: Identificador y Check de Selección */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                  <Chip label={`Pieza ${idx + 1}`} size="small" color={isSelected ? "primary" : "default"} sx={{ fontWeight: "bold", height: 24 }} />
                  {isSelected && (
                    <Zoom in={true}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: theme.palette.primary.main }}>
                        <Typography variant="caption" fontWeight="bold">
                          EDITANDO
                        </Typography>
                        <CheckCircleIcon fontSize="small" />
                      </Box>
                    </Zoom>
                  )}
                  {!isSelected && piece.appliedAddons.length > 0 && (
                    <Tooltip title="Tiene trabajos configurados">
                      <ConstructionIcon sx={{ fontSize: 16, color: "text.secondary", opacity: 0.5 }} />
                    </Tooltip>
                  )}
                </Box>

                <Divider sx={{ mb: 1.5, borderColor: isSelected ? theme.palette.primary.light : "divider", opacity: isSelected ? 0.2 : 1 }} />

                {/* Body: Material Visual */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                  <Avatar src={material?.imageUrl} variant="rounded" sx={{ width: 40, height: 40, border: "1px solid rgba(0,0,0,0.1)" }}>
                    <StyleIcon />
                  </Avatar>
                  <Box sx={{ overflow: "hidden" }}>
                    <Typography variant="body2" fontWeight="bold" noWrap>
                      {material?.name || "Sin Material"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      {Object.values(piece.selectedAttributes)[0] || "Base"}
                    </Typography>
                  </Box>
                </Box>

                {/* Footer: Medidas (Siempre visible) */}
                <Box
                  sx={{
                    bgcolor: isSelected ? theme.palette.primary.light : "#eee",
                    color: isSelected ? theme.palette.primary.contrastText : "text.primary",
                    borderRadius: 1.5,
                    py: 0.5,
                    px: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                    mt: "auto", // Empuja al fondo
                    transition: "background-color 0.3s",
                  }}
                >
                  <StraightenIcon sx={{ fontSize: 16, opacity: 0.8 }} />
                  <Typography variant="caption" fontWeight="bold">
                    {piece.measurements.length_mm} x {piece.measurements.width_mm} mm
                  </Typography>
                </Box>
              </CardActionArea>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
};
