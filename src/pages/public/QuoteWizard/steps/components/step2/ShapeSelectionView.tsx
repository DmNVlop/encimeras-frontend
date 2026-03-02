import React, { useMemo } from "react";
import { Box, Typography, Grid } from "@mui/material";
import { Step2Header } from "./Step2Header";
import { ShapeCard } from "./ShapeCard";
import { shapeVariations } from "@/pages/public/common/shapes-step2";
import type { ShapeVariation } from "@/interfases/shape-variation.interfase";

interface ShapeSelectionViewProps {
  onSelectVariation: (variation: ShapeVariation) => void;
}

export const ShapeSelectionView: React.FC<ShapeSelectionViewProps> = ({ onSelectVariation }) => {
  // Grupos de variaciones
  const groupedVariations = useMemo(() => {
    return shapeVariations.reduce(
      (acc, variation) => {
        if (!acc[variation.group]) {
          acc[variation.group] = [];
        }
        acc[variation.group].push(variation);
        return acc;
      },
      {} as Record<string, ShapeVariation[]>,
    );
  }, []);

  return (
    <Box sx={{ pb: 4 }}>
      <Step2Header title="Elige la forma principal" subtitle="Qué forma tendrá tu encimera." />

      {Object.entries(groupedVariations).map(([groupName, variationsInGroup]) => (
        <Box key={groupName} sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            sx={{
              textTransform: "uppercase",
              mb: 2,
              fontWeight: "bold",
              letterSpacing: 1,
            }}
          >
            {groupName} ({variationsInGroup[0].count} {variationsInGroup[0].count > 1 ? "Piezas" : "Pieza"})
          </Typography>
          <Grid container spacing={2}>
            {variationsInGroup.map((variation) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={variation.id}>
                <ShapeCard variation={variation} onSelect={onSelectVariation} />
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}
    </Box>
  );
};
