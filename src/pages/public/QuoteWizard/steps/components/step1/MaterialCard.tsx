import React from "react";
import { Card, CardActionArea, CardMedia, CardContent, Typography } from "@mui/material";
import type { Material } from "@/interfases/materials.interfase";

interface MaterialCardProps {
  material: Material;
  isSelected: boolean;
  onSelect: (material: Material) => void;
}

export const MaterialCard: React.FC<MaterialCardProps> = ({ material, isSelected, onSelect }) => {
  return (
    <Card
      onClick={() => onSelect(material)}
      raised={isSelected}
      sx={{
        border: isSelected ? 2 : "none",
        borderColor: "primary.main",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.2s ease-in-out",
        "&:hover": {
          transform: "scale(1.02)",
        },
      }}
    >
      <CardActionArea sx={{ flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "stretch" }}>
        <CardMedia
          component="img"
          height="160"
          image={(material as any).imageUrl || "/placeholder-material.png"}
          alt={material.name}
          sx={{ objectFit: "cover" }}
        />
        <CardContent>
          <Typography gutterBottom variant="h6" component="div" sx={{ fontWeight: "bold" }}>
            {material.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Categoría: {material.category}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};
