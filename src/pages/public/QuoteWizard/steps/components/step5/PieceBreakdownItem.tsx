import React from "react";
import { Paper, Box, Typography, Avatar, Divider, Chip } from "@mui/material";
import StraightenIcon from "@mui/icons-material/Straighten";
import type { BreakdownPiece } from "@/interfases/price.interfase";

interface PieceBreakdownItemProps {
  piece: BreakdownPiece;
  materialImage?: string;
  materialName?: string;
  originalPieceData: any;
}

export const PieceBreakdownItem: React.FC<PieceBreakdownItemProps> = ({ piece, materialImage, materialName, originalPieceData }) => {
  return (
    <Paper
      elevation={2}
      sx={{
        overflow: "hidden",
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          boxShadow: 6,
          borderColor: "primary.light",
        },
      }}
    >
      {/* Cabecera de la Pieza */}
      <Box
        sx={{
          bgcolor: (theme) => (theme.palette.mode === "dark" ? "grey.800" : "grey.50"),
          p: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="subtitle1" fontWeight="bold">
          {piece.pieceName}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {piece.discountAmount && piece.discountAmount > 0 ? (
            <>
              <Typography variant="body2" sx={{ textDecoration: "line-through", opacity: 0.5 }}>
                {piece.subtotalPoints.toFixed(2)} Pts
              </Typography>
              <Typography variant="h6" color="success.main" fontWeight="bold">
                {piece.finalPricePoints.toFixed(2)} Pts
              </Typography>
              <Chip
                label={`¡Ahorras ${piece.discountAmount.toFixed(2)} pts!`}
                size="small"
                color="success"
                sx={{ fontWeight: "bold", height: 24, fontSize: "0.75rem" }}
              />
            </>
          ) : (
            <Typography variant="h6" color="primary.main" fontWeight="bold">
              {piece.subtotalPoints.toFixed(2)} Pts
            </Typography>
          )}
        </Box>
      </Box>

      {/* Detalles de la Pieza */}
      <Box sx={{ p: 2 }}>
        {/* Material Base */}
        <Box
          sx={{
            display: "flex",
            gap: 3,
            alignItems: "center",
            mb: 2,
            p: 2.5,
            bgcolor: (theme) => (theme.palette.mode === "dark" ? "rgba(255,255,255,0.03)" : "grey.50"),
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            position: "relative",
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: "4px",
              bgcolor: "primary.main",
            },
          }}
        >
          <Avatar
            src={materialImage}
            alt={materialName}
            variant="rounded"
            sx={{
              width: 90,
              height: 90,
              border: "2px solid #fff",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              backgroundColor: "#fff",
            }}
          />

          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: "800",
                    color: "primary.main",
                    textTransform: "uppercase",
                    letterSpacing: 1.5,
                    display: "block",
                    mb: 0.5,
                  }}
                >
                  Material Base (Encimera)
                </Typography>
                <Typography variant="h6" sx={{ fontSize: "1.1rem", fontWeight: "bold", color: "text.primary", lineHeight: 1.2 }}>
                  {materialName || "Material Seleccionado"}
                </Typography>
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="h6" fontWeight="800" color="primary.main">
                  {piece.basePricePoints.toFixed(2)}
                  <Typography component="span" variant="caption" sx={{ ml: 0.5, fontWeight: "bold" }}>
                    Pts
                  </Typography>
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 1.5, opacity: 0.6 }} />

            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  px: 1.2,
                  py: 0.4,
                  bgcolor: "background.paper",
                  borderRadius: 1.5,
                  border: "1px solid #e0e0e0",
                }}
              >
                <StraightenIcon sx={{ fontSize: "0.9rem", color: "text.secondary" }} />
                <Typography variant="body2" fontWeight="600" sx={{ fontSize: "0.85rem" }}>
                  {originalPieceData?.measurements.length_mm} x {originalPieceData?.measurements.width_mm} mm
                </Typography>
              </Box>

              {Object.entries(originalPieceData?.selectedAttributes || {}).map(([key, value]) => (
                <Chip
                  key={key}
                  label={value as string}
                  size="small"
                  sx={{
                    borderRadius: 1.5,
                    bgcolor: "rgba(0,0,0,0.04)",
                    fontWeight: "500",
                    fontSize: "0.75rem",
                    height: 24,
                    "& .MuiChip-label": { px: 1.5 },
                  }}
                />
              ))}
            </Box>
          </Box>
        </Box>

        {piece.addons.length > 0 && <Divider sx={{ my: 1.5 }} />}

        {/* Addons List */}
        {piece.addons.map((addon: any, aIdx: number) => (
          <Box
            key={aIdx}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1.5,
              "&:last-child": { mb: 0 },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              {addon.imageUrl ? (
                <Avatar src={addon.imageUrl} alt={addon.name || addon.addonName} variant="rounded" sx={{ width: 40, height: 40, border: "1px solid #eee" }} />
              ) : (
                <Avatar variant="rounded" sx={{ width: 40, height: 40, bgcolor: "grey.200", color: "grey.500", fontSize: "0.75rem" }}>
                  IMG
                </Avatar>
              )}

              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ color: "#333" }}>
                  {addon.name || addon.addonName}
                </Typography>
                {addon.name && addon.name !== addon.addonName && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    REF: {addon.addonName}
                  </Typography>
                )}
              </Box>
            </Box>

            <Typography variant="body2" fontWeight="bold">
              {addon.pricePoints > 0 ? `+ ${addon.pricePoints.toFixed(2)} Pts` : "Incluido"}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};
