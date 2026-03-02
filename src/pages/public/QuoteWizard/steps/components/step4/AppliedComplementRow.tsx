import React from "react";
import { Box, Typography, Paper, Avatar, Tooltip, IconButton, Fade } from "@mui/material";
import ExtensionIcon from "@mui/icons-material/Extension";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { MeasurementInput } from "@/components/admin/inputs/MeasurementInput";
import type { Addon } from "@/interfases/addon.interfase";
import type { AppliedAddon } from "@/context/QuoteInterfases";

interface AppliedComplementRowProps {
  appliedAddon: AppliedAddon;
  addonDef?: Addon;
  imageUrl: string;
  onRemove: () => void;
  onUpdate: (field: string, val: string) => void;
  onError: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

export const AppliedComplementRow: React.FC<AppliedComplementRowProps> = ({ appliedAddon, addonDef, imageUrl, onRemove, onUpdate, onError }) => {
  if (!addonDef) return null;

  return (
    <Fade in={true}>
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 2,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 2,
          borderLeft: "4px solid #9c27b0",
          backgroundColor: "#fff",
        }}
      >
        {/* 1. Miniatura */}
        <Avatar
          src={imageUrl}
          variant="rounded"
          sx={{
            width: 64,
            height: 64,
            bgcolor: "#f0f0f0",
            border: "1px solid #eee",
          }}
          imgProps={{ onError }}
        >
          <ExtensionIcon color="action" />
        </Avatar>

        {/* 2. Información */}
        <Box sx={{ flexGrow: 1, minWidth: "200px" }}>
          <Typography variant="subtitle1" fontWeight="bold">
            {addonDef.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Ajusta cantidad o medidas
          </Typography>
        </Box>

        {/* 3. Inputs Dinámicos */}
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
          {addonDef.requiredMeasurements.map((fieldKey) => (
            <MeasurementInput key={fieldKey} fieldKey={fieldKey} value={appliedAddon.measurements[fieldKey]} onChange={(key, val) => onUpdate(key, val)} />
          ))}
        </Box>

        {/* 4. Botón Eliminar */}
        <Tooltip title="Quitar complemento">
          <IconButton onClick={onRemove} color="error" size="small" sx={{ ml: 1 }}>
            <DeleteOutlineIcon />
          </IconButton>
        </Tooltip>
      </Paper>
    </Fade>
  );
};
