import React from "react";
import { Grid, Box, Typography } from "@mui/material";
import { MaterialCard } from "./MaterialCard";
import type { Material } from "@/interfases/materials.interfase";

interface MaterialsGridProps {
  materials: Material[];
  selectedMaterialId?: string;
  searchTerm: string;
  onMaterialSelect: (material: Material) => void;
}

export const MaterialsGrid: React.FC<MaterialsGridProps> = ({ materials, selectedMaterialId, searchTerm, onMaterialSelect }) => {
  if (materials.length === 0) {
    return (
      <Box sx={{ width: "100%", textAlign: "center", mt: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No se encontraron materiales que coincidan con "{searchTerm}".
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {materials.map((material) => (
        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={material._id}>
          <MaterialCard material={material} isSelected={selectedMaterialId === material._id} onSelect={onMaterialSelect} />
        </Grid>
      ))}
    </Grid>
  );
};
