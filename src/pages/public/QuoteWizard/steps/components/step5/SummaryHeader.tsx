import React from "react";
import { Box, Typography, Avatar, useTheme } from "@mui/material";
import SummarizeIcon from "@mui/icons-material/Summarize";
import { SummaryActions } from "./SummaryActions";

interface SummaryHeaderProps {
  isSavingDraft: boolean;
  isCalculating: boolean;
  isAddingToCart: boolean; // Nuevo
  canAction: boolean;
  onSaveDraft: () => void;
  onCalculate: () => void;
  onAddToCart: () => void;
  isEditingCart?: boolean; // Nuevo
}

export const SummaryHeader: React.FC<SummaryHeaderProps> = ({
  isSavingDraft,
  isCalculating,
  isAddingToCart, // Nuevo
  canAction,
  onSaveDraft,
  onCalculate,
  onAddToCart,
  isEditingCart = false, // Nuevo
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        mb: 4,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 2,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Avatar
          sx={{
            bgcolor: theme.palette.primary.main,
            boxShadow: "0 4px 10px rgba(25, 118, 210, 0.3)",
          }}
        >
          <SummarizeIcon />
        </Avatar>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: "bold", color: "#333" }}>
            Resumen y Envío
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Detalles del proyecto y envio de solicitud de orden.
          </Typography>
        </Box>
      </Box>

      {/* GRUPO DE BOTONES DE ACCIÓN */}
      <SummaryActions
        isSavingDraft={isSavingDraft}
        isCalculating={isCalculating}
        isAddingToCart={isAddingToCart}
        canAction={canAction}
        onSaveDraft={onSaveDraft}
        onCalculate={onCalculate}
        onAddToCart={onAddToCart}
        isEditingCart={isEditingCart}
      />
    </Box>
  );
};
