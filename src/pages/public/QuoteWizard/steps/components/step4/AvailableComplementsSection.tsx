import React from "react";
import { Grid, Divider, Chip } from "@mui/material";
import ExtensionIcon from "@mui/icons-material/Extension";
import { AvailableComplementCard } from "./AvailableComplementCard";
import type { Addon } from "@/interfases/addon.interfase";

interface AvailableComplementsSectionProps {
  compatibleComplements: Addon[];
  getImageUrl: (addon: Addon | undefined) => string;
  handleImageError: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  handleAddAddon: (pieceIndex: number, addon: Addon) => void;
  activeTabIndex: number;
}

export const AvailableComplementsSection: React.FC<AvailableComplementsSectionProps> = ({
  compatibleComplements,
  getImageUrl,
  handleImageError,
  handleAddAddon,
  activeTabIndex,
}) => {
  return (
    <>
      <Divider sx={{ my: 4 }}>
        <Chip label="Catálogo de Complementos Disponibles" color="secondary" variant="outlined" icon={<ExtensionIcon />} />
      </Divider>

      <Grid container spacing={2}>
        {compatibleComplements.map((addon) => (
          <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2 }} key={addon._id}>
            <AvailableComplementCard
              addon={addon}
              imageUrl={getImageUrl(addon)}
              onError={handleImageError}
              onAdd={() => handleAddAddon(activeTabIndex, addon)}
            />
          </Grid>
        ))}
      </Grid>
    </>
  );
};
