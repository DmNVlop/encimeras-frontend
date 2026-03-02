import { useEffect, useState, Suspense, lazy } from "react";
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
  Edit as EditIcon,
  InfoOutlined as InfoOutlinedIcon,
  ViewInAr as ViewInArIcon,
  BuildOutlined as BuildOutlinedIcon,
} from "@mui/icons-material";
import { useCart } from "@/context/CartContext";
import { useCartLoadAction } from "@/hooks/useCartLoadAction";
import { CartLoadConflictDialog } from "@/components/cart/CartLoadConflictDialog";
import { CustomerSelection } from "@/pages/public/QuoteWizard/steps/components/step5/CustomerSelection";
import type { ICustomer } from "@/interfases/customer.interfase";
import { get } from "@/services/api.service";
import { useAuth } from "@/context/AuthProvider";

// Importación diferida (Lazy Load) del módulo pesado PDF
const LazyDownloadPdfButton = lazy(() => import("@/components/cart/DownloadPdfButton"));

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
            Gestiona tus presupuestos agrupados antes de confirmar el pedido final.
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
                        <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          {item.hydratedContext?.materials?.[0]?.name || item.uiState?.wizardTempMaterial?.materialName || "Configuración Personalizada"}
                        </Typography>

                        {/* Detalles técnicos de las Piezas */}
                        {item.core.mainPieces && item.core.mainPieces.length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography
                              variant="caption"
                              fontWeight="bold"
                              color="text.secondary"
                              sx={{ textTransform: "uppercase", letterSpacing: 1, mb: 1, display: "inline-block" }}
                            >
                              Desglose Técnico ({item.core.mainPieces.length} piezas)
                            </Typography>
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                              {item.core.mainPieces.map((piece, idx) => (
                                <Paper
                                  key={idx}
                                  elevation={0}
                                  sx={{
                                    p: 1.5,
                                    bgcolor: alpha(theme.palette.primary.light, 0.05),
                                    border: "1px solid",
                                    borderColor: alpha(theme.palette.primary.main, 0.1),
                                    borderRadius: 2,
                                    minWidth: 160,
                                    transition: "all 0.2s ease-in-out",
                                    "&:hover": {
                                      bgcolor: alpha(theme.palette.primary.light, 0.1),
                                      borderColor: alpha(theme.palette.primary.main, 0.3),
                                      transform: "translateY(-2px)",
                                    },
                                  }}
                                >
                                  <Typography
                                    variant="caption"
                                    fontWeight="bold"
                                    color="primary.main"
                                    gutterBottom
                                    sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                                  >
                                    <ViewInArIcon sx={{ fontSize: 14 }} /> PIEZA {idx + 1}
                                  </Typography>
                                  <Typography variant="body2" color="text.primary" fontWeight="medium">
                                    {piece.length_mm}{" "}
                                    <Typography component="span" variant="caption" color="text.secondary">
                                      x
                                    </Typography>{" "}
                                    {piece.width_mm}{" "}
                                    <Typography component="span" variant="caption" color="text.secondary">
                                      mm
                                    </Typography>
                                  </Typography>

                                  {piece.appliedAddons && piece.appliedAddons.length > 0 && (
                                    <Box sx={{ mt: 1, pt: 1, borderTop: "1px dashed", borderColor: alpha(theme.palette.divider, 0.8) }}>
                                      <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                        <BuildOutlinedIcon sx={{ fontSize: 12, color: "text.secondary" }} /> {piece.appliedAddons.length}{" "}
                                        {piece.appliedAddons.length === 1 ? "proceso" : "procesos"} adicionales
                                      </Typography>
                                    </Box>
                                  )}
                                </Paper>
                              ))}
                            </Box>
                          </Box>
                        )}

                        {/* Feedback de Descuentos Individuales */}
                        {item.discountAmount > 0 ? (
                          <Box
                            sx={{
                              mt: 1,
                              p: 1,
                              bgcolor: alpha(theme.palette.success.main, 0.05),
                              borderRadius: 2,
                              border: "1px solid",
                              borderColor: alpha(theme.palette.success.main, 0.2),
                            }}
                          >
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                              <Typography
                                variant="caption"
                                sx={{ fontWeight: "bold", px: 1, py: 0.2, bgcolor: "success.main", color: "white", borderRadius: 1 }}
                              >
                                DESCUENTO ÍTEM
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ textDecoration: "line-through" }}>
                                Base: {(item.originalPoints || item.subtotalPoints + item.discountAmount)?.toLocaleString()} pts
                              </Typography>
                            </Box>

                            {/* Mostrar reglas aplicadas si el backend las proporciona */}
                            {(item.appliedRules || item.appliedDiscounts) && (item.appliedRules || item.appliedDiscounts)!.length > 0 ? (
                              <>
                                {(item.appliedRules || item.appliedDiscounts)!.map((discount, i) => (
                                  <Typography key={i} variant="caption" color="success.main" display="block" fontWeight="medium">
                                    ✓ {discount.ruleName}: -
                                    {discount.discountAmount?.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} pts
                                  </Typography>
                                ))}
                                {(item.appliedRules || item.appliedDiscounts)!.length > 1 && (
                                  <Box sx={{ borderTop: "1px dashed", borderColor: alpha(theme.palette.success.main, 0.3), mt: 0.5, pt: 0.5 }}>
                                    <Typography variant="caption" color="success.main" fontWeight="bold">
                                      Total ítem: -{item.discountAmount?.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} pts
                                    </Typography>
                                  </Box>
                                )}
                              </>
                            ) : (
                              // Fallback si no hay array de reglas
                              <Typography variant="caption" color="success.main" display="block" fontWeight="medium">
                                ✓ Descuento aplicado: -{item.discountAmount?.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}{" "}
                                pts
                              </Typography>
                            )}

                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                              <Typography variant="caption" fontWeight="bold" color="text.secondary">
                                Subtotal Neto:
                              </Typography>
                              <Typography variant="h6" color="primary.main" fontWeight="bold" sx={{ lineHeight: 1 }}>
                                {item.subtotalPoints?.toLocaleString()} pts
                              </Typography>
                            </Box>
                          </Box>
                        ) : (
                          <Typography variant="h6" color="primary.main" fontWeight="bold" sx={{ mt: 1 }}>
                            {(item.originalPoints || item.subtotalPoints)?.toLocaleString()} pts
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button size="small" startIcon={<EditIcon />} onClick={() => initiateLoad(item)} sx={{ borderRadius: 2 }}>
                        Editar
                      </Button>
                      <IconButton color="error" onClick={() => removeFromCart(item.cartItemId || item._id || item.id || "")} size="small">
                        <DeleteIcon />
                      </IconButton>
                    </Box>
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

            {cart.totalDiscount > 0 && (
              <>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography color="text.secondary">Subtotal bruto:</Typography>
                  <Typography fontWeight="medium">{totalOriginalPoints.toLocaleString()} pts</Typography>
                </Box>

                {/* Ahorro en Ítems (si existe) */}
                {totalItemDiscounts > 0 && (
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography color="success.main" variant="body2">
                      Ahorro en ítems:
                    </Typography>
                    <Typography color="success.main" variant="body2" fontWeight="medium">
                      - {totalItemDiscounts.toLocaleString()} pts
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
                        - {totalGlobalDiscounts.toLocaleString(undefined, { maximumFractionDigits: 2 })} pts
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
                              -{rule.discountAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} pts
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
                    - {cart.totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} pts
                  </Typography>
                </Box>
              </>
            )}

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
                disabled={isProcessingCheckout || isDirty || isAssigning}
                sx={{ py: 1.5, borderRadius: 2, fontWeight: "bold", fontSize: "1.1rem" }}
              >
                {isDirty ? "Recalcule para finalizar" : "Finalizar Pedido"}
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

      {/* DIÁLOGO DE CONFLICTO */}
      <CartLoadConflictDialog open={isDialogOpen} onClose={closeDialog} onAction={handleConflictAction} isProcessing={isProcessing} />
    </Box>
  );
}
