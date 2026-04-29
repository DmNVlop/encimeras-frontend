import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  Stack,
  Button,
  TextField,
  InputAdornment,
  useTheme,
  alpha,
  Paper,
  MenuItem,
  Select,
  type SelectChangeEvent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Checkbox,
  ListItemText,
  Snackbar,
  Alert,
  Slide,
  Chip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import CloseIcon from "@mui/icons-material/Close";

import AdminPageTitle from "./components/AdminPageTitle";
import CustomerList from "./customers/CustomerList";
import CustomerDrawer from "./customers/CustomerDrawer";
import { type ICustomer } from "@/interfases/customer.interfase";
import type { User } from "@/interfases/user.interfase";
import { getCustomers, getSalesUsers, batchDeleteCustomers, batchAssignSales } from "@/services/customer.service";
import { GlobalSettingsService } from "@/services/global-settings.service";
import { useAuth } from "@/context/AuthProvider";

const CustomersPage: React.FC = () => {
  const theme = useTheme();
  const { user: currentUser } = useAuth();
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<ICustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const lastClickedRef = useRef<{ id: string; index: number } | null>(null);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(null);
  const [isNew, setIsNew] = useState(false);

  // Batch actions state
  const [salesUsers, setSalesUsers] = useState<User[]>([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSalesUsers, setSelectedSalesUsers] = useState<string[]>([]);
  const [multiSalesEnabled, setMultiSalesEnabled] = useState<boolean>(true);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const isAdminOrOwner = currentUser?.roles?.includes("ADMIN") || currentUser?.roles?.includes("OWNER") || currentUser?.roles?.includes("MANAGER");
  const isWorker = currentUser?.roles?.includes("WORKER");
  const showAuthor = isAdminOrOwner || isWorker;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Siempre cargar customers
      const customersPromise = getCustomers();

      // Cargar sales users y settings si es ADMIN/OWNER/WORKER (para resolución de autoría)
      const promises = (isAdminOrOwner || isWorker) ? [customersPromise, getSalesUsers(), GlobalSettingsService.getMultiSalesPerCustomer()] : [customersPromise];

      const results = await Promise.allSettled(promises);

      // Extraer resultados con tipos correctos
      const customersData = results[0].status === "fulfilled" ? (results[0].value as ICustomer[]) : [];
      const salesData = results[1]?.status === "fulfilled" ? (results[1].value as User[]) : [];
      const multiSalesEnabled = results[2]?.status === "fulfilled" ? (results[2].value as boolean) : true;

      setCustomers(customersData);
      setSalesUsers(salesData);
      setMultiSalesEnabled(multiSalesEnabled);
    } catch (error) {
      console.error("Error loading customers:", error);
    } finally {
      setLoading(false);
    }
  }, [isAdminOrOwner, isWorker]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const term = search.toLowerCase();
    const filtered = customers.filter((c) => {
      const matchesSearch =
        c.officialName.toLowerCase().includes(term) ||
        (c.nif && c.nif.toLowerCase().includes(term)) ||
        (c.contact?.email && c.contact.email.toLowerCase().includes(term));

      const matchesType = typeFilter === "ALL" || c.type === typeFilter;

      return matchesSearch && matchesType;
    });
    setFilteredCustomers(filtered);
  }, [search, typeFilter, customers]);

  const handleCreateNew = () => {
    setSelectedCustomer(null);
    setIsNew(true);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedCustomer(null);
    setIsNew(false);
  };

  // Selection handlers
  const handleSelect = useCallback((customer: ICustomer, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const id = customer._id || "";
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const handleRowClick = useCallback(
    (customer: ICustomer, index: number, event: React.MouseEvent) => {
      const id = customer._id || "";

      if (event.ctrlKey || event.metaKey) {
        handleSelect(customer, !selectedIds.has(id));
        lastClickedRef.current = { id, index };
      } else if (event.shiftKey && lastClickedRef.current !== null) {
        const start = Math.min(lastClickedRef.current.index, index);
        const end = Math.max(lastClickedRef.current.index, index);
        const idsInRange = filteredCustomers.slice(start, end + 1).map((c) => c._id || "");
        setSelectedIds((prev) => {
          const next = new Set(prev);
          idsInRange.forEach((cid) => next.add(cid));
          return next;
        });
      } else {
        setSelectedIds(new Set([id]));
        lastClickedRef.current = { id, index };
      }
    },
    [filteredCustomers, handleSelect, selectedIds],
  );

  const handleSelectAll = useCallback(
    (selectAll: boolean, visibleOnly: boolean) => {
      if (selectAll) {
        const idsToSelect = visibleOnly ? filteredCustomers.map((c) => c._id || "") : customers.map((c) => c._id || "");
        setSelectedIds(new Set(idsToSelect));
      } else {
        setSelectedIds(new Set());
      }
    },
    [filteredCustomers, customers],
  );

  // Batch actions
  const handleBatchAssign = async () => {
    try {
      // Validación frontend antes de enviar
      if (!multiSalesEnabled && selectedSalesUsers.length > 1) {
        setSnackbar({
          open: true,
          message: "Multi-sales está deshabilitado. Solo puedes asignar 1 usuario sales.",
          severity: "error",
        });
        return;
      }

      if (selectedSalesUsers.length === 0) {
        setSnackbar({
          open: true,
          message: "Debes seleccionar al menos un usuario sales.",
          severity: "error",
        });
        return;
      }

      const customerIds = Array.from(selectedIds);
      await batchAssignSales(customerIds, selectedSalesUsers);
      setSnackbar({ open: true, message: "Usuarios asignados correctamente", severity: "success" });
      setAssignDialogOpen(false);
      setSelectedSalesUsers([]);
      setSelectedIds(new Set());
      fetchData();
    } catch (error: any) {
      let errorMessage = "Error al asignar usuarios";
      if (error.response?.status === 404) {
        errorMessage = "Sales users no encontrados o sin rol SALES";
      } else if (error.response?.status === 403) {
        errorMessage = "Multi-sales deshabilitado y se enviaron más de 1 usuario";
      } else if (error.response?.status === 400) {
        errorMessage = "No se encontraron clientes activos para asignar";
      }
      setSnackbar({ open: true, message: errorMessage, severity: "error" });
    }
  };

  const handleBatchDelete = async () => {
    try {
      const customerIds = Array.from(selectedIds);
      await batchDeleteCustomers(customerIds);
      setSnackbar({ open: true, message: "Clientes eliminados correctamente", severity: "success" });
      setDeleteDialogOpen(false);
      setSelectedIds(new Set());
      fetchData();
    } catch (error: any) {
      let errorMessage = "Error al eliminar clientes";
      if (error.response?.status === 404) {
        errorMessage = "No se encontraron clientes activos para eliminar";
      } else if (error.response?.status === 403) {
        errorMessage = "No tienes permisos para eliminar estos clientes";
      }
      setSnackbar({ open: true, message: errorMessage, severity: "error" });
    }
  };

  const selectedCount = selectedIds.size;

  return (
    <Box sx={{ pb: 8 }}>
      {/* Header Section */}
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", md: "flex-end" }} sx={{ mb: 5 }} spacing={3}>
        <Box>
          <AdminPageTitle>Directorio de Clientes</AdminPageTitle>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1, opacity: 0.8 }}>
            Gestiona empresas y particulares activos.
          </Typography>
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "stretch", sm: "center" }} sx={{ width: { xs: "100%", md: "auto" } }}>
          {/* Type Filter */}
          <Box sx={{ width: { xs: "100%", sm: 160 } }}>
            <Select
              fullWidth
              size="small"
              value={typeFilter}
              onChange={(e: SelectChangeEvent) => setTypeFilter(e.target.value)}
              sx={{
                borderRadius: "12px",
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                height: "48px",
                fontWeight: 600,
              }}
            >
              <MenuItem value="ALL">Todos</MenuItem>
              <MenuItem value="COMPANY">Empresas</MenuItem>
              <MenuItem value="INDIVIDUAL">Particulares</MenuItem>
            </Select>
          </Box>

          {/* Filter Bar */}
          <Box sx={{ width: { xs: "100%", sm: 250, md: 350 } }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "text.secondary", opacity: 0.5 }} />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: "12px",
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                  height: "48px",
                },
              }}
            />
          </Box>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateNew}
            sx={{
              borderRadius: 3,
              fontWeight: 800,
              px: 4,
              height: "48px",
              backgroundColor: "#222",
              "&:hover": { backgroundColor: "#000" },
              boxShadow: `0 8px 16px -4px ${alpha(theme.palette.common.black, 0.3)}`,
              textTransform: "none",
              fontSize: "1rem",
              whiteSpace: "nowrap",
            }}
          >
            Nuevo Cliente
          </Button>
        </Stack>
      </Stack>

      {/* Main List Container */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 6,
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          background: alpha(theme.palette.background.paper, 0.3),
          backdropFilter: "blur(20px)",
        }}
      >
        <CustomerList
          customers={filteredCustomers}
          loading={loading}
          selectedIds={selectedIds}
          salesUsers={salesUsers}
          showAuthor={showAuthor}
          onCustomerClick={(customer) => {
            const index = filteredCustomers.findIndex((c) => c._id === customer._id);
            handleRowClick(customer, index, { ctrlKey: false, metaKey: false, shiftKey: false } as React.MouseEvent);
          }}
          onSelect={handleSelect}
          onSelectAll={handleSelectAll}
        />
      </Paper>

      {/* Batch Actions Bar */}
      <Slide direction="up" in={selectedCount > 0} mountOnEnter unmountOnExit>
        <Paper
          elevation={8}
          sx={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            px: 4,
            py: 2,
            borderRadius: 4,
            background: alpha(theme.palette.background.paper, 0.95),
            backdropFilter: "blur(20px)",
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            boxShadow: `0 12px 40px -12px ${alpha(theme.palette.common.black, 0.4)}`,
            display: "flex",
            alignItems: "center",
            gap: 3,
            zIndex: 1200,
          }}
        >
          <Chip
            label={`${selectedCount} cliente${selectedCount !== 1 ? "s" : ""} seleccionado${selectedCount !== 1 ? "s" : ""}`}
            sx={{
              fontWeight: 700,
              fontSize: "0.9rem",
              py: 2.5,
              px: 1,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          />
          <Box sx={{ display: "flex", gap: 1.5 }}>
            {isAdminOrOwner && (
              <Button
                variant="outlined"
                startIcon={<PersonAddIcon />}
                onClick={() => setAssignDialogOpen(true)}
                sx={{
                  borderRadius: 2,
                  fontWeight: 700,
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                  color: theme.palette.primary.main,
                  "&:hover": {
                    borderColor: theme.palette.primary.main,
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  },
                }}
              >
                Asignar Sales
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<DeleteOutlineIcon />}
              onClick={() => setDeleteDialogOpen(true)}
              sx={{
                borderRadius: 2,
                fontWeight: 700,
                borderColor: alpha(theme.palette.error.main, 0.3),
                color: theme.palette.error.main,
                "&:hover": {
                  borderColor: theme.palette.error.main,
                  backgroundColor: alpha(theme.palette.error.main, 0.05),
                },
              }}
            >
              Eliminar
            </Button>
          </Box>
          <Button
            onClick={() => setSelectedIds(new Set())}
            sx={{
              minWidth: "auto",
              p: 1,
              color: "text.secondary",
              "&:hover": { backgroundColor: alpha(theme.palette.action.hover, 0.1) },
            }}
          >
            <CloseIcon />
          </Button>
        </Paper>
      </Slide>

      {/* Assign Sales Dialog */}
      <Dialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 4,
              background: alpha(theme.palette.background.paper, 0.95),
              backdropFilter: "blur(20px)",
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: "1.25rem" }}>Asignar Usuarios Sales</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Selecciona los usuarios sales que quieres asignar a los {selectedCount} clientes seleccionados.
            {!multiSalesEnabled && (
              <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
                <Typography variant="caption" fontWeight={700}>
                  ⚠️ Multi-sales deshabilitado: Solo puedes asignar 1 usuario sales por cliente
                </Typography>
              </Alert>
            )}
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Usuarios Sales</InputLabel>
            <Select
              multiple
              value={selectedSalesUsers}
              onChange={(e) => setSelectedSalesUsers(e.target.value as string[])}
              renderValue={(selected) =>
                selected
                  .map((id) => {
                    const user = salesUsers.find((u) => u._id === id);
                    return user ? user.name || user.username : id;
                  })
                  .join(", ")
              }
              sx={{ borderRadius: 2 }}
            >
              {salesUsers.map((user) => (
                <MenuItem key={user._id} value={user._id}>
                  <Checkbox checked={selectedSalesUsers.includes(user._id)} />
                  <ListItemText primary={user.name || user.username} secondary={user.email} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setAssignDialogOpen(false)} sx={{ fontWeight: 700 }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleBatchAssign}
            disabled={selectedSalesUsers.length === 0}
            sx={{
              fontWeight: 700,
              backgroundColor: theme.palette.primary.main,
              "&:hover": { backgroundColor: theme.palette.primary.dark },
            }}
          >
            Asignar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 4,
              background: alpha(theme.palette.background.paper, 0.95),
              backdropFilter: "blur(20px)",
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: "1.25rem", color: "error.main" }}>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            ¿Estás seguro de que quieres eliminar <strong>{selectedCount}</strong> cliente{selectedCount !== 1 ? "s" : ""}? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ fontWeight: 700 }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleBatchDelete}
            sx={{
              fontWeight: 700,
              backgroundColor: theme.palette.error.main,
              "&:hover": { backgroundColor: theme.palette.error.dark },
            }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ fontWeight: 700, borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Details Drawer */}
      <CustomerDrawer open={drawerOpen} customer={selectedCustomer} isNew={isNew} onClose={handleCloseDrawer} onRefresh={fetchData} />
    </Box>
  );
};

export default CustomersPage;
