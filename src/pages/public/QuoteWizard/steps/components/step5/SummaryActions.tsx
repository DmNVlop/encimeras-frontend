import React from "react";
import { Box, Button, CircularProgress, useTheme, alpha } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import CalculateIcon from "@mui/icons-material/Calculate";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";

export interface SummaryActionsProps {
  isSavingDraft: boolean;
  isCalculating: boolean;
  isAddingToCart: boolean;
  canAction: boolean;
  onSaveDraft: () => void;
  onCalculate: () => void;
  onAddToCart: () => void;
  isEditingCart?: boolean;
}

export const SummaryActions: React.FC<SummaryActionsProps> = ({
  isSavingDraft,
  isCalculating,
  isAddingToCart,
  canAction,
  onSaveDraft,
  onCalculate,
  onAddToCart,
  isEditingCart = false,
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        flexWrap: "wrap",
        justifyContent: { xs: "center", md: "flex-end" },
      }}
    >
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
  );
};
