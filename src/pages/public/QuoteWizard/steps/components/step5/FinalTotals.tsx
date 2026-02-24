import React from "react";
import { Paper, Box, Typography } from "@mui/material";

interface FinalTotalsProps {
  totalPoints: number;
  totalDiscount: number;
  finalTotalPoints: number;
}

export const FinalTotals: React.FC<FinalTotalsProps> = ({ totalPoints, totalDiscount, finalTotalPoints }) => {
  return (
    <Box sx={{ mt: 2 }}>
      {/* Detalle de totales antes del bloque final */}
      <Box sx={{ px: 3, mb: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
          <Typography variant="body1" sx={{ color: "text.secondary", fontWeight: 500 }}>
            Subtotal Bruto
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {totalPoints.toFixed(2)} Pts
          </Typography>
        </Box>
        {totalDiscount > 0 && (
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="body1" sx={{ color: "success.main", fontWeight: 500 }}>
              Total Descuentos
            </Typography>
            <Typography variant="body1" sx={{ color: "success.main", fontWeight: 600 }}>
              -{totalDiscount.toFixed(2)} Pts
            </Typography>
          </Box>
        )}
      </Box>

      <Paper
        elevation={6}
        sx={{
          p: 3,
          background: (theme) =>
            theme.palette.mode === "dark"
              ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`
              : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: "primary.contrastText",
          borderRadius: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight="900" sx={{ letterSpacing: 0.5 }}>
            TOTAL FINAL
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8, fontWeight: 500 }}>
            Puntos netos tras descuentos
          </Typography>
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Typography variant="h3" fontWeight="900" sx={{ lineHeight: 1 }}>
            {finalTotalPoints.toFixed(2)}
            <Typography component="span" variant="h6" sx={{ ml: 1, opacity: 0.8, fontWeight: "bold" }}>
              Pts
            </Typography>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};
