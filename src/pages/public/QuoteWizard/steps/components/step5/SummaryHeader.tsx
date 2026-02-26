import React from "react";
import { Box, Button, Typography, Avatar, CircularProgress, useTheme, alpha } from "@mui/material";
import SummarizeIcon from "@mui/icons-material/Summarize";
import SaveIcon from "@mui/icons-material/Save";
import CalculateIcon from "@mui/icons-material/Calculate";

import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";

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
      <Box sx={{ display: "flex", gap: 2 }}>
        <Button
          variant="outlined"
          color="primary"
          size="large"
          startIcon={isSavingDraft ? <CircularProgress size={20} /> : <SaveIcon />}
          onClick={onSaveDraft}
          disabled={isSavingDraft || !canAction}
          sx={{
            py: 1.2,
            px: 3,
            borderRadius: 2,
            fontWeight: "bold",
            transition: "all 0.2s",
            "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.05) },
          }}
        >
          {isSavingDraft ? "Guardando..." : "Guardar Borrador"}
        </Button>

        <Button
          variant="outlined"
          color="secondary"
          size="large"
          startIcon={isAddingToCart ? <CircularProgress size={20} /> : <ShoppingCartIcon />}
          onClick={onAddToCart}
          disabled={isAddingToCart || !canAction}
          sx={{
            py: 1.2,
            px: 3,
            borderRadius: 2,
            fontWeight: "bold",
            transition: "all 0.2s",
            "&:hover": { bgcolor: alpha(theme.palette.secondary.main, 0.05) },
          }}
        >
          {isAddingToCart ? (isEditingCart ? "Actualizando..." : "Añadiendo...") : isEditingCart ? "Actualizar Carrito" : "Añadir al Carrito"}
        </Button>

        <Box sx={{ position: "relative" }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<CalculateIcon />}
            onClick={onCalculate}
            disabled={isCalculating || !canAction}
            sx={{
              py: 1.2,
              px: 3,
              borderRadius: 2,
              fontWeight: "bold",
              boxShadow: theme.shadows[4],
            }}
          >
            {isCalculating ? "Calculando..." : "Calcular Presupuesto"}
          </Button>
          {isCalculating && (
            <CircularProgress
              size={24}
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                marginTop: "-12px",
                marginLeft: "-12px",
              }}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
};
