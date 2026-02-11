import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  CircularProgress,
  Container,
  Stepper,
  Step,
  StepLabel,
  useTheme,
  useMediaQuery,
  IconButton,
  Divider,
} from "@mui/material";
import { Add as AddIcon, Search as SearchIcon, FilterList as FilterListIcon, ChevronRight, ReceiptLong } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { ordersApi } from "@/services/orders.service";
import type { Order, OrderStatus } from "@/interfases/orders.interfase";

// Utility to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
};

// Utility to format date
const formatDate = (dateString: Date | string) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// Mapping status to Stepper active step
const getStatusStep = (status: OrderStatus) => {
  switch (status) {
    case "PENDING":
      return 0; // Confirmado / Pendiente
    case "MANUFACTURING":
      return 1; // Producción
    case "SHIPPED":
      return 2; // Enviado
    case "INSTALLED":
      return 3; // Instalado -> Completo
    default:
      return 0;
  }
};

const steps = ["Confirmado", "Producción", "Enviado", "Entregado"];

export default function MyQuotes() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  const fetchOrders = async (status?: string) => {
    setLoading(true);
    try {
      // If we have a status filter from tabs, use it.
      // Note: The "All" tab likely passes undefined or empty string.
      const data = await ordersApi.findAll(status);
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(statusFilter);
  }, [statusFilter]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    // Map tabs to status
    // 0: Todos, 1: Pendiente, 2: Producción, 3: Enviado, 4: Finalizado
    let status: string | undefined;
    switch (newValue) {
      case 1:
        status = "PENDING";
        break;
      case 2:
        status = "MANUFACTURING";
        break;
      case 3:
        status = "SHIPPED";
        break;
      case 4:
        status = "INSTALLED"; // Assuming Installed is history/completed
        break;
      default:
        status = undefined;
    }
    setStatusFilter(status);
  };

  // Client-side search filtering (since API search might not be implemented yet or strictly required by prompt to be server-side search)
  // The implementation plan mentioned Search input.
  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const orderNum = order.header.orderNumber.toLowerCase();
    const customer = order.header.customerId.toLowerCase();
    return orderNum.includes(query) || customer.includes(query);
  });

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* HEADER */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "start", sm: "center" }} spacing={2} mb={4}>
        <Typography variant="h4" fontWeight="bold" sx={{ color: "text.primary" }}>
          Mis Pedidos
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          onClick={() => navigate("/quote")}
          sx={{
            borderRadius: 2,
            px: 4,
            textTransform: "none",
            fontWeight: 600,
            boxShadow: 2,
          }}
        >
          Nuevo Presupuesto
        </Button>
      </Stack>

      {/* FILTERS & SEARCH */}
      <Card sx={{ mb: 4, borderRadius: 3, boxShadow: "0px 4px 20px rgba(0,0,0,0.05)" }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems="center" sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              px: 2,
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.95rem",
                minHeight: 64,
              },
            }}
          >
            <Tab label="Todos" />
            <Tab label="Pendientes" />
            <Tab label="En Producción" />
            <Tab label="Enviados" />
            <Tab label="Historial" />
          </Tabs>

          <Box sx={{ p: 2, width: { xs: "100%", md: 300 } }}>
            <TextField
              fullWidth
              placeholder="Buscar pedido..."
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2, bgcolor: "background.default" },
              }}
            />
          </Box>
        </Stack>
      </Card>

      {/* ORDERS LIST */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : filteredOrders.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
          <ReceiptLong sx={{ fontSize: 60, mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" gutterBottom>
            No se encontraron pedidos
          </Typography>
          <Typography variant="body2">Intenta cambiar los filtros o crea un nuevo presupuesto.</Typography>
        </Box>
      ) : (
        <Stack spacing={3}>
          {filteredOrders.map((order) => (
            <OrderCard key={order._id} order={order} />
          ))}
        </Stack>
      )}
    </Container>
  );
}

// Sub-component for individual Order Card
function OrderCard({ order }: { order: Order }) {
  const { header } = order;
  const activeStep = getStatusStep(header.status);

  // Assuming naming convention based on image
  // Image shows "Reforma Cocina Sra. García" as title.
  // We don't have this field in OrderHeader explicitly, so we use customerId or a fallback.
  // In a real app, customerId might need to be resolved to a name or the order might have a 'projectReference'.
  // Using customerId for now as per schema.
  const title = `Pedido ${header.orderNumber}`;
  const subtitle = header.customerId || "Cliente Desconocido";

  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: "0px 2px 12px rgba(0,0,0,0.04)",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0px 8px 24px rgba(0,0,0,0.08)",
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* Top Row: Icon + Info + Price */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between">
            <Stack direction="row" spacing={2} alignItems="flex-start">
              {/* Thumbnail Placeholder */}
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  bgcolor: "grey.100",
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <img
                  src="https://placehold.co/60x60/png?text=IMG" // Placeholder for material image
                  alt="Material"
                  style={{ width: "100%", height: "100%", borderRadius: 8, objectFit: "cover" }}
                />
              </Box>

              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {subtitle} • {formatDate(header.orderDate)}
                </Typography>
                {/* 
                  Image shows: "PRE-2023-001 - Silestone Et. Calacatta Gold" 
                  We don't have material info in Header easily without digging into items.
                  We could try to take the first item's material if possible, but keeping it simple for now.
                 */}
              </Box>
            </Stack>

            <Box sx={{ textAlign: { xs: "left", sm: "right" } }}>
              <Typography variant="h6" fontWeight="800" color="primary.main">
                {header.totalPoints ? header.totalPoints + " pts" : "—"}
              </Typography>
              <Typography variant="caption" display="block" color="text.secondary">
                Total Estimado
              </Typography>
            </Box>
          </Stack>

          <Divider />

          {/* Bottom Row: Stepper + Action */}
          <Stack direction={{ xs: "column", md: "row" }} alignItems="center" spacing={4}>
            <Box sx={{ flexGrow: 1, width: "100%" }}>
              <Typography variant="overline" color="text.secondary" fontWeight="bold" sx={{ mb: 1, display: "block" }}>
                SEGUIMIENTO DE FÁBRICA
              </Typography>
              <Stepper activeStep={activeStep} alternativeLabel>
                {steps.map((label, index) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>

            <Button variant="text" endIcon={<ChevronRight />} sx={{ fontWeight: 600, minWidth: 120 }}>
              Ver detalles
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
