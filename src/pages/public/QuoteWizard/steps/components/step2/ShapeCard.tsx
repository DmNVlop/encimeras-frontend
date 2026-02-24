import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import EncimeraPreview from "@/pages/public/common/EncimeraPreview/encimera-preview";
import type { ShapeVariation } from "@/interfases/shape-variation.interfase";

interface ShapeCardProps {
  variation: ShapeVariation;
  onSelect: (variation: ShapeVariation) => void;
}

export const ShapeCard: React.FC<ShapeCardProps> = ({ variation, onSelect }) => {
  return (
    <Paper
      variant="outlined"
      onClick={() => onSelect(variation)}
      sx={{
        p: 2,
        textAlign: "center",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          borderColor: "primary.main",
          boxShadow: 2,
          transform: "translateY(-4px)",
        },
      }}
    >
      <Box
        sx={{
          width: "200px",
          height: "120px",
          alignContent: "center",
          justifyItems: "center",
          mx: "auto",
          mb: 1,
          "& .encimera-preview-container": {
            minHeight: "80px",
            gap: "2px",
          },
          "& .encimera-pieza": {
            backgroundSize: "18px 18px",
          },
        }}
      >
        <EncimeraPreview
          config={{
            id: variation.id,
            name: variation.name,
            grid: variation.grid,
            pieces: variation.pieces,
          }}
        />
      </Box>
      <Typography variant="caption" fontWeight="bold">
        {variation.name}
      </Typography>
    </Paper>
  );
};
