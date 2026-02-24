import React from "react";
import { Box, Typography, IconButton, List, ListItem, Avatar, Divider, Button, alpha, useTheme, CircularProgress, Tooltip } from "@mui/material";
import {
  Delete as DeleteIcon,
  DeleteSweep as ClearIcon,
  ArrowForward as ArrowForwardIcon,
  ShoppingCart as CartIcon,
  Description as DescriptionIcon,
} from "@mui/icons-material";
import { useCart } from "@/context/CartContext";
import { useNavigate } from "react-router-dom";

interface MiniCartMenuProps {
  onClose: () => void;
}

export const MiniCartMenu: React.FC<MiniCartMenuProps> = ({ onClose }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { cart, loading, removeFromCart, clearCart, checkout, isProcessingCheckout } = useCart();

  const totalPoints = cart?.items.reduce((sum, item) => sum + item.subtotalPoints, 0) || 0;
  const itemsCount = cart?.items.length || 0;

  const handleCheckout = async () => {
    try {
      onClose();
      // Si el checkout es exitoso, el CartContext manejará el estado.
      // Podríamos navegar al carrito para mostrar el proceso detallado o dejarlo aquí.
      // Para una experiencia fluida, si no está en el carrito, lo llevamos allí para que vea el progreso real.
      navigate("/cart");
      await checkout();
    } catch (error) {
      console.error("MiniCart Checkout Error:", error);
    }
  };

  const handleClearCart = async () => {
    if (window.confirm("¿Estás seguro de que quieres vaciar el carrito?")) {
      await clearCart();
    }
  };

  if (loading && !cart) {
    return (
      <Box sx={{ p: 4, textAlign: "center", width: 320 }}>
        <CircularProgress size={30} />
      </Box>
    );
  }

  if (!cart || itemsCount === 0) {
    return (
      <Box sx={{ p: 4, textAlign: "center", width: 320 }}>
        <Avatar
          sx={{
            width: 60,
            height: 60,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: theme.palette.primary.main,
            mx: "auto",
            mb: 2,
          }}
        >
          <CartIcon sx={{ fontSize: 32 }} />
        </Avatar>
        <Typography variant="subtitle1" fontWeight="bold">
          Carrito vacío
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No tienes productos seleccionados.
        </Typography>
        <Button
          variant="contained"
          fullWidth
          onClick={() => {
            navigate("/quote");
            onClose();
          }}
          size="small"
          sx={{ borderRadius: 2 }}
        >
          Diseñar Encimera
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ width: 350, maxHeight: 500, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
        <Typography variant="subtitle1" fontWeight="bold">
          Tu Carrito ({itemsCount})
        </Typography>
        <Tooltip title="Vaciar todo">
          <IconButton size="small" color="error" onClick={handleClearCart}>
            <ClearIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      <Divider />

      {/* Items List */}
      <List sx={{ p: 0, overflowY: "auto", maxHeight: 300 }}>
        {cart.items.map((item, index) => (
          <React.Fragment key={item.cartItemId || item._id || index}>
            <ListItem
              sx={{
                py: 1.5,
                px: 2,
                display: "flex",
                gap: 2,
                "&:hover": { bgcolor: "rgba(0,0,0,0.02)" },
              }}
            >
              <Avatar
                sx={{
                  bgcolor: alpha(theme.palette.secondary.main, 0.1),
                  color: theme.palette.secondary.main,
                  borderRadius: 2,
                  width: 40,
                  height: 40,
                }}
                variant="rounded"
              >
                <DescriptionIcon fontSize="small" />
              </Avatar>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight="bold" noWrap>
                  {item.customName}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }} noWrap>
                  {item.technicalSnapshot?.wizardTempMaterial?.materialName || "Configuración"}
                </Typography>
                <Typography variant="body2" color="primary.main" fontWeight="bold">
                  {item.subtotalPoints.toLocaleString()} pts
                </Typography>
              </Box>
              <IconButton
                size="small"
                color="error"
                onClick={() => removeFromCart(item.cartItemId || item._id || item.id || "")}
                sx={{ opacity: 0.6, "&:hover": { opacity: 1 } }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </ListItem>
            {index < itemsCount - 1 && <Divider component="li" />}
          </React.Fragment>
        ))}
      </List>

      <Divider />

      {/* Footer */}
      <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Total estimado:
          </Typography>
          <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
            {totalPoints.toLocaleString()} pts
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            fullWidth
            size="small"
            onClick={() => {
              navigate("/cart");
              onClose();
            }}
            sx={{ borderRadius: 2 }}
          >
            Ver Carrito
          </Button>
          <Button
            variant="contained"
            fullWidth
            size="small"
            endIcon={<ArrowForwardIcon />}
            onClick={handleCheckout}
            disabled={isProcessingCheckout}
            sx={{ borderRadius: 2, fontWeight: "bold" }}
          >
            {isProcessingCheckout ? "Procesando..." : "Finalizar"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
