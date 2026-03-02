import React from "react";
import { Box, Typography, Alert } from "@mui/material";
import { AppliedComplementRow } from "./AppliedComplementRow";
import type { Addon } from "@/interfases/addon.interfase";
import type { AppliedAddon } from "@/context/QuoteInterfases";

interface AppliedComplementsSectionProps {
  activeTabIndex: number;
  appliedComplements: (AppliedAddon & { originalIndex: number })[];
  complementAddons: Addon[];
  getImageUrl: (addon: Addon | undefined) => string;
  handleImageError: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  handleRemoveAddon: (pieceIndex: number, addonIndex: number) => void;
  handleUpdateMeasurement: (pieceIndex: number, addonIndexInPiece: number, field: string, val: string) => void;
}

export const AppliedComplementsSection: React.FC<AppliedComplementsSectionProps> = ({
  activeTabIndex,
  appliedComplements,
  complementAddons,
  getImageUrl,
  handleImageError,
  handleRemoveAddon,
  handleUpdateMeasurement,
}) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 1, fontWeight: "bold" }}>
          COMPLEMENTOS EN PIEZA {activeTabIndex + 1}
        </Typography>
      </Box>

      {appliedComplements.length === 0 ? (
        <Alert severity="info" variant="outlined" sx={{ mb: 2, borderStyle: "dashed" }}>
          No hay complementos en esta pieza. Selecciona uno abajo.
        </Alert>
      ) : (
        appliedComplements.map((applied) => {
          const def = complementAddons.find((d) => d.code === applied.code);
          return (
            <AppliedComplementRow
              key={`${applied.code}-${applied.originalIndex}`}
              appliedAddon={applied}
              addonDef={def}
              imageUrl={getImageUrl(def)}
              onError={handleImageError}
              onRemove={() => handleRemoveAddon(activeTabIndex, applied.originalIndex)}
              onUpdate={(field, val) => handleUpdateMeasurement(activeTabIndex, applied.originalIndex, field, val)}
            />
          );
        })
      )}
    </Box>
  );
};
