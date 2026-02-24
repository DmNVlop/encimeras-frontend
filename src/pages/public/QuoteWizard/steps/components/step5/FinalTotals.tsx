import React from "react";
import { Paper, Box, Typography } from "@mui/material";

interface FinalTotalsProps {
  totalPoints: number;
  originalTotal?: number;
}

export const FinalTotals: React.FC<FinalTotalsProps> = ({ totalPoints, originalTotal }) => {
  return (
    <Paper
      elevation={4}
      sx={{
        p: 3,
        bgcolor: "primary.main",
        color: "primary.contrastText",
        borderRadius: 3,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mt: 2,
      }}
    >
      <Box>
        <Typography variant="h5" fontWeight="bold">
          TOTAL FINAL
        </Typography>
        {originalTotal && (
          <Typography variant="body2" sx={{ opacity: 0.7, textDecoration: "line-through" }}>
            Antes: {originalTotal.toFixed(2)} Pts
          </Typography>
        )}
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          Tras descuentos aplicados
        </Typography>
      </Box>
      <Typography variant="h3" fontWeight="bold">
        {totalPoints.toFixed(2)}
      </Typography>
    </Paper>
  );
};
