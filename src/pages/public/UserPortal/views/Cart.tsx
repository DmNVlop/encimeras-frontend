import { useEffect, useState, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Collapse,
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
  Edit as EditIcon,
  InfoOutlined as InfoOutlinedIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import { useCart } from "@/context/CartContext";
import { useCartLoadAction } from "@/hooks/useCartLoadAction";
import { CartLoadConflictDialog } from "@/components/cart/CartLoadConflictDialog";
import { DraftNamingDialog } from "@/pages/public/QuoteWizard/components/DraftNamingDialog";
import { CustomerSelection } from "@/pages/public/QuoteWizard/steps/components/step5/CustomerSelection";
import PriceBreakdownPanel from "@/components/cart/PriceBreakdownPanel";
import type { ICustomer } from "@/interfases/customer.interfase";
import { get } from "@/services/api.service";
import { useAuth } from "@/context/AuthProvider";

// Importación diferida (Lazy Load) del módulo pesado PDF
const LazyDownloadPdfButton = lazy(() => import("@/components/cart/DownloadPdfButton"));

// Sub-componente: desglose colapsable de un ítem del carrito
function CartItemBreakdown({ item, theme }: { item: any; theme: any }) {
  const [open, setOpen] = useState(false);
  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 0.75,
          bgcolor: alpha(theme.palette.primary.main, 0.03),
          borderTop: "1px solid",
          borderColor: "divider",
          cursor: "pointer",
          userSelect: "none",
        }}
        onClick={() => setOpen((v) => !v)}
      >
        <Typography variant="caption" color="primary.main" fontWeight={600} sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
          Ver desglose de precios
        </Typography>
        <ExpandMoreIcon
          fontSize="small"
          sx={{
            color: "primary.main",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        />
      </Box>
      <Collapse in={open}>
        <Box sx={{ px: 2, py: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
          <PriceBreakdownPanel
            piecesBreakdown={item.piecesBreakdown}
            originalPoints={item.originalPoints ?? item.subtotalPoints}
            subtotalPoints={item.subtotalPoints}
            discountAmount={item.discountAmount ?? 0}
          />
        </Box>
      </Collapse>
    </Box>
  );
}

export default function Cart() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    cart,
    loading,
    isProcessingCheckout,
    lastCreatedOrder,
    removeFromCart,
    checkout,
    saveAsDrafts,
    clearCart,
    clearLastOrder,
    assignCustomer,
    clearCartCustomer, // Añadido
  } = useCart();
  const { initiateLoad, isDialogOpen, closeDialog, handleConflictAction, isProcessing } = useCartLoadAction();
  const [showRescuePolling, setShowRescuePolling] = useState(false);
  const [showNamingDialog, setShowNamingDialog] = useState(false);

  // Estados para el cliente
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  // Cargar clientes
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoadingCustomers(true);
      try {
        const data = await get<ICustomer[]>("/customers");
        setCustomers(data);
      } catch (err) {
        console.error("Error fetching customers for cart:", err);
      } finally {
        setLoadingCustomers(false);
      }
    };
    fetchCustomers();
  }, []);

  // Setear cliente seleccionado desde el carrito
  useEffect(() => {
    if (cart?.customerId && customers.length > 0) {
      const customer = customers.find((c) => c._id === cart.customerId);
      if (customer) {
        setSelectedCustomer(customer);
      }
    } else if (!cart?.customerId) {
      setSelectedCustomer(null);
    }
  }, [cart?.customerId, customers]);

  const handleCustomerChange = (newCustomer: ICustomer | null) => {
    setSelectedCustomer(newCustomer);
    // Si cambia respecto al cliente actual del carrito, marcamos como sucio
    const currentId = cart?.customerId || null;
    const nextId = newCustomer?._id || null;
    setIsDirty(currentId !== nextId);
  };

  const handleApplyCustomer = async () => {
    if (!selectedCustomer) {
      // Si se limpia el cliente, también hay que persistirlo en el backend
      try {
        setIsAssigning(true);
        await clearCartCustomer(); // Necesitaremos esta función o usar assignCustomer con null/empty
        setIsDirty(false);
      } catch (error) {
        console.error("Error al limpiar el cliente:", error);
      } finally {
        setIsAssigning(false);
      }
      return;
    }

    try {
      setIsAssigning(true);
      await assignCustomer(selectedCustomer._id!);
      setIsDirty(false);
    } catch (error) {
      console.error("Error al asignar el cliente en el carrito:", error);
    } finally {
      setIsAssigning(false);
    }
  };

  // Redirigir al éxito cuando el pedido se complete
  useEffect(() => {
    if (lastCreatedOrder) {
      const orderNumber = lastCreatedOrder.orderNumber;
      clearLastOrder();
      // Podríamos navegar a una página de éxito específica o al dashboard con un mensaje
      navigate("/my-quotes", { state: { message: `¡Presupuesto ${orderNumber} creado con éxito!` } });
    }
  }, [lastCreatedOrder, navigate, clearLastOrder]);

  const handleCheckout = () => {
    setShowNamingDialog(true);
  };

  const handleConfirmCheckout = async (orderName: string) => {
    try {
      setShowNamingDialog(false);
      setShowRescuePolling(false);
      await checkout(orderName);
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

  // Totales y Desgloses de Ahorro
  const totalOriginalPoints = cart.totalOriginalPoints || cart.items.reduce((sum, item) => sum + (item.originalPoints || item.subtotalPoints), 0);
  const totalItemDiscounts = cart.items.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
  const totalGlobalDiscounts = cart.totalDiscount - totalItemDiscounts;
  const totalPoints = cart.totalPoints || totalOriginalPoints - cart.totalDiscount;

  return (
    <Box sx={{ maxWidth: "90vw", mx: "auto", py: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Mi Carrito
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestiona tus presupuestos agrupados antes de confirmar finalmente.
          </Typography>
        </Box>
        <Button
          variant="text"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={() => {
            if (window.confirm("¿Estás seguro de que quieres vaciar todo el carrito?")) {
              clearCart();
            }
          }}
          sx={{
            fontWeight: "bold",
            borderRadius: 2,
            "&:hover": { bgcolor: alpha(theme.palette.error.main, 0.05) },
          }}
        >
          Vaciar Carrito
        </Button>
      </Box>

      <Box sx={{ display: "flex", gap: 4, flexDirection: { xs: "column", md: "row" } }}>
        {/* Listado de Items y Selección de Cliente */}
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ position: "relative", mb: 4 }}>
            <CustomerSelection
              customers={customers}
              selectedCustomer={selectedCustomer}
              loadingCustomers={loadingCustomers}
              onCustomerChange={handleCustomerChange}
              // Sobrescribimos el mensaje informativo por uno dinámico si es necesario,
              // pero mejor manejamos el botón aquí para control total
            />
            {isDirty && (
              <Paper
                elevation={4}
                sx={{
                  p: 2,
                  mt: -3,
                  mb: 3,
                  mx: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  bgcolor: alpha(theme.palette.warning.main, 0.9),
                  color: "warning.contrastText",
                  borderRadius: 2,
                  zIndex: 2,
                  position: "relative",
                  border: "1px solid",
                  borderColor: "warning.light",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <InfoOutlinedIcon />
                  <Typography variant="body2" fontWeight="bold">
                    Has cambiado el cliente. Los precios pueden haber variado.
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  color="inherit"
                  size="small"
                  onClick={handleApplyCustomer}
                  disabled={isAssigning}
                  sx={{
                    color: "warning.main",
                    bgcolor: "white",
                    fontWeight: "bold",
                    "&:hover": { bgcolor: alpha("#fff", 0.9) },
                  }}
                  startIcon={isAssigning ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                >
                  {isAssigning ? "Recalculando..." : "Recalcular Presupuesto"}
                </Button>
              </Paper>
            )}
          </Box>

          <List sx={{ p: 0, display: "flex", flexDirection: "column", gap: 2 }}>
            {cart.items.map((item, index) => (
              <Card
                key={item.cartItemId || item._id || item.id || `cart-item-${index}`}
                elevation={0}
                sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}
              >
                <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
                  {/* Cabecera del ítem */}
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", p: 2 }}>
                    <Box sx={{ display: "flex", gap: 2, flex: 1, minWidth: 0 }}>
                      <Avatar sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), color: theme.palette.secondary.main, borderRadius: 2, flexShrink: 0 }}>
                        <DescriptionIcon />
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle1" fontWeight="bold" noWrap>
                          {item.customName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.hydratedContext?.materials?.[0]?.name || item.uiState?.wizardTempMaterial?.materialName || "Configuración Personalizada"}
                          {item.piecesBreakdown && item.piecesBreakdown.length > 0 && (
                            <Typography component="span" variant="caption" color="text.disabled" sx={{ ml: 1 }}>
                              · {item.piecesBreakdown.length} pieza{item.piecesBreakdown.length !== 1 ? "s" : ""}
                            </Typography>
                          )}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.5, ml: 1 }}>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button size="small" startIcon={<EditIcon />} onClick={() => initiateLoad(item)} sx={{ borderRadius: 2 }}>
                          Editar
                        </Button>
                        <IconButton color="error" onClick={() => removeFromCart(item.cartItemId || item._id || item.id || "")} size="small">
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                      <Typography variant="h6" color="primary.main" fontWeight="bold">
                        {(item.subtotalPoints ?? item.originalPoints)?.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Desglose de precios por pieza */}
                  {item.piecesBreakdown && item.piecesBreakdown.length > 0 && (
                    <CartItemBreakdown item={item} theme={theme} />
                  )}
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
              Resumen del Presupuesto
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography color="text.secondary">Items totales:</Typography>
              <Typography fontWeight="medium">{cart.items.length}</Typography>
            </Box>

            {cart.totalDiscount > 0 && (
              <>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography color="text.secondary">Subtotal bruto:</Typography>
                  <Typography fontWeight="medium">{totalOriginalPoints.toLocaleString()} </Typography>
                </Box>

                {/* Ahorro en Ítems (si existe) */}
                {totalItemDiscounts > 0 && (
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography color="success.main" variant="body2">
                      Ahorro en ítems:
                    </Typography>
                    <Typography color="success.main" variant="body2" fontWeight="medium">
                      - {totalItemDiscounts.toLocaleString()}
                    </Typography>
                  </Box>
                )}

                {/* Ahorro Global (si existe) */}
                {totalGlobalDiscounts > 0 && (
                  <>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                      <Typography color="success.main" variant="body2">
                        Descuentos globales:
                      </Typography>
                      <Typography color="success.main" variant="body2" fontWeight="medium">
                        - {totalGlobalDiscounts.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </Typography>
                    </Box>

                    {/* Desglose de Reglas Globales */}
                    {cart.appliedGlobalRules && cart.appliedGlobalRules.length > 0 && (
                      <Box sx={{ mb: 1, pl: 2, borderLeft: "2px solid", borderColor: alpha(theme.palette.success.main, 0.2) }}>
                        {cart.appliedGlobalRules.map((rule, i) => (
                          <Box key={i} sx={{ display: "flex", justifyContent: "space-between", mb: 0.2 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
                              • {rule.ruleName}
                            </Typography>
                            <Typography variant="caption" color="success.main">
                              -{rule.discountAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </>
                )}

                <Divider sx={{ my: 1, borderStyle: "dashed" }} />

                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography color="success.main" fontWeight="bold">
                    Ahorro total:
                  </Typography>
                  <Typography color="success.main" fontWeight="bold">
                    - {cart.totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                  </Typography>
                </Box>
              </>
            )}

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                Total:
              </Typography>
              <Typography variant="h5" color="primary.main" fontWeight="bold">
                {totalPoints.toLocaleString()}
              </Typography>
            </Box>

            <Box sx={{ mt: 4, display: "flex", flexDirection: "column", gap: 2 }}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                endIcon={<ArrowForwardIcon />}
                onClick={handleCheckout}
                disabled={isProcessingCheckout || isDirty || isAssigning}
                sx={{ py: 1.5, borderRadius: 2, fontWeight: "bold", fontSize: "1.1rem" }}
              >
                {isDirty ? "Recalcule para finalizar" : "Finalizar Presupuesto"}
              </Button>

              <Button variant="outlined" fullWidth startIcon={<SaveIcon />} onClick={saveAsDrafts} disabled={isProcessingCheckout} sx={{ borderRadius: 2 }}>
                Guardar todo como Borrador
              </Button>

              <Suspense
                fallback={
                  <Button variant="outlined" color="info" disabled fullWidth sx={{ borderRadius: 2, borderWidth: 2 }}>
                    Cargando módulo PDF...
                  </Button>
                }
              >
                <LazyDownloadPdfButton cart={cart} user={user} customer={selectedCustomer} disabled={isProcessingCheckout || isDirty || isAssigning} />
              </Suspense>
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
            Procesando su presupuesto
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

      {/* DIÁLOGO DE CONFLICTO */}
      <CartLoadConflictDialog open={isDialogOpen} onClose={closeDialog} onAction={handleConflictAction} isProcessing={isProcessing} />

      {/* DIÁLOGO DE NOMBRADO DE ORDEN */}
      <DraftNamingDialog
        open={showNamingDialog}
        onClose={() => setShowNamingDialog(false)}
        onConfirm={handleConfirmCheckout}
        isSaving={isProcessingCheckout}
        title="Finalizar Presupuesto"
        subtitle="Asigna un nombre a este presupuesto para identificarlo fácilmente."
      />
    </Box>
  );
}
