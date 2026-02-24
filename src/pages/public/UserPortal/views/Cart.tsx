import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  List,
  Avatar,
  CircularProgress,
  Paper,
  alpha,
  useTheme,
  Backdrop,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  ShoppingCart as CartIcon,
  Description as DescriptionIcon,
  ArrowForward as ArrowForwardIcon,
  Save as SaveIcon,
  Construction as ConstructionIcon,
} from "@mui/icons-material";
import { useCart } from "@/context/CartContext";

export default function Cart() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { cart, loading, isProcessingCheckout, lastCreatedOrder, removeFromCart, checkout, saveAsDrafts, clearLastOrder } = useCart();
  const [showRescuePolling, setShowRescuePolling] = useState(false);

  // Redirigir al éxito cuando el pedido se complete
  useEffect(() => {
    if (lastCreatedOrder) {
      const orderNumber = lastCreatedOrder.orderNumber;
      clearLastOrder();
      // Podríamos navegar a una página de éxito específica o al dashboard con un mensaje
      navigate("/dashboard", { state: { message: `¡Pedido ${orderNumber} creado con éxito!` } });
    }
  }, [lastCreatedOrder, navigate, clearLastOrder]);

  const handleCheckout = async () => {
    try {
      setShowRescuePolling(false);
      await checkout();
      // Timeout de rescate: 45 segundos
      setTimeout(() => setShowRescuePolling(true), 45000);
    } catch (error) {
      console.error("Error initiating checkout:", error);
    }
  };

  if (loading && !cart) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          py: 12,
          textAlign: "center",
        }}
      >
        <Avatar
          sx={{
            width: 80,
            height: 80,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: theme.palette.primary.main,
            mb: 3,
          }}
        >
          <CartIcon sx={{ fontSize: 40 }} />
        </Avatar>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Tu carrito está vacío
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400 }}>
          Parece que aún no has añadido ninguna configuración a tu carrito. ¡Empieza a diseñar tu encimera ahora!
        </Typography>
        <Button variant="contained" size="large" onClick={() => navigate("/quote")} sx={{ borderRadius: 2, px: 4 }}>
          Ir al Presupuestador
        </Button>
      </Box>
    );
  }

  const totalPoints = cart.items.reduce((sum, item) => sum + item.subtotalPoints, 0);

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", py: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Mi Carrito
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Gestiona tus presupuestos agrupados antes de confirmar el pedido final.
      </Typography>

      <Box sx={{ display: "flex", gap: 4, flexDirection: { xs: "column", md: "row" } }}>
        {/* Listado de Items */}
        <Box sx={{ flexGrow: 1 }}>
          <List sx={{ p: 0, display: "flex", flexDirection: "column", gap: 2 }}>
            {cart.items.map((item) => (
              <Card key={item._id} elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Avatar sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), color: theme.palette.secondary.main, borderRadius: 2 }}>
                        <DescriptionIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {item.customName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.configuration.wizardTempMaterial?.name || "Configuración Personalizada"}
                        </Typography>
                        <Typography variant="h6" color="primary.main" fontWeight="bold" sx={{ mt: 1 }}>
                          {item.subtotalPoints.toLocaleString()} pts
                        </Typography>
                      </Box>
                    </Box>
                    <IconButton color="error" onClick={() => removeFromCart(item._id)} size="small">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </List>
        </Box>

        {/* Resumen y Acciones */}
        <Box sx={{ width: { xs: "100%", md: 350 } }}>
          <Paper
            elevation={0}
            sx={{ p: 3, borderRadius: 4, border: "1px solid", borderColor: "primary.light", bgcolor: alpha(theme.palette.primary.main, 0.02) }}
          >
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Resumen del Pedido
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography color="text.secondary">Items totales:</Typography>
              <Typography fontWeight="medium">{cart.items.length}</Typography>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                Total:
              </Typography>
              <Typography variant="h5" color="primary.main" fontWeight="bold">
                {totalPoints.toLocaleString()} pts
              </Typography>
            </Box>

            <Box sx={{ mt: 4, display: "flex", flexDirection: "column", gap: 2 }}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                endIcon={<ArrowForwardIcon />}
                onClick={handleCheckout}
                disabled={isProcessingCheckout}
                sx={{ py: 1.5, borderRadius: 2, fontWeight: "bold", fontSize: "1.1rem" }}
              >
                Finalizar Pedido
              </Button>

              <Button variant="outlined" fullWidth startIcon={<SaveIcon />} onClick={saveAsDrafts} disabled={isProcessingCheckout} sx={{ borderRadius: 2 }}>
                Guardar todo como Borrador
              </Button>
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Overlay de Procesamiento ASYNC */}
      <Backdrop
        sx={{
          color: "#fff",
          zIndex: (theme) => theme.zIndex.drawer + 999,
          flexDirection: "column",
          gap: 3,
          textAlign: "center",
          px: 4,
          backdropFilter: "blur(4px)",
        }}
        open={isProcessingCheckout}
      >
        <Box sx={{ position: "relative", display: "inline-flex" }}>
          <CircularProgress size={80} thickness={2} color="inherit" />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: "absolute",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ConstructionIcon sx={{ fontSize: 30, animation: "pulse 2s infinite" }} />
          </Box>
        </Box>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Procesando su pedido
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.8, maxWidth: 600, mb: 4 }}>
            Estamos generando los planos técnicos y la documentación oficial. Este proceso puede tardar unos segundos. Por favor, no cierre la ventana.
          </Typography>

          {showRescuePolling && (
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => window.location.reload()} // O un polling manual si existiera el endpoint
              sx={{ borderColor: "rgba(255,255,255,0.5)", "&:hover": { borderColor: "#fff", bgcolor: "rgba(255,255,255,0.1)" } }}
            >
              Verificar estado manualmente
            </Button>
          )}
        </Box>
      </Backdrop>

      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); opacity: 0.6; }
            50% { transform: scale(1.2); opacity: 1; }
            100% { transform: scale(1); opacity: 0.6; }
          }
        `}
      </style>
    </Box>
  );
}
