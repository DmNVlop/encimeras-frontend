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
import { getCustomers, batchDeleteCustomers, batchAssignSales } from "@/services/customer.service";
import { getUsers } from "@/services/user.service";
import { useAuth } from "@/context/AuthProvider";
import { useFactorySettings } from "@/context/FactorySettingsContext";

const CustomersPage: React.FC = () => {
  const theme = useTheme();
  const { user: currentUser } = useAuth();
  const { settings } = useFactorySettings();
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
  const [assignableUsers, setAssignableUsers] = useState<User[]>([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAssignedUsers, setSelectedAssignedUsers] = useState<string[]>([]);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const multiAssignedEnabled = settings?.multiAssignedUsersPerCustomer ?? true;

  const isAdminOrOwner = currentUser?.roles?.includes("ADMIN") || currentUser?.roles?.includes("OWNER") || currentUser?.roles?.includes("MANAGER");
  const isWorker = currentUser?.roles?.includes("WORKER");
  const showAuthor = isAdminOrOwner || isWorker;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const customersPromise = getCustomers();

      const promises = (isAdminOrOwner || isWorker)
        ? [
            customersPromise,
            // Cargar SALES y MANAGER en paralelo para el selector de asignación
            Promise.all([
              getUsers({ role: "SALES" }).catch(() => [] as User[]),
              getUsers({ role: "MANAGER" }).catch(() => [] as User[]),
            ]),
          ]
        : [customersPromise];

      const results = await Promise.allSettled(promises);

      const customersData = results[0].status === "fulfilled" ? (results[0].value as ICustomer[]) : [];

      if (results[1]?.status === "fulfilled") {
        const [salesUsers, managerUsers] = results[1].value as [User[], User[]];
        // Mezclar y deduplicar por _id
        const combined = [...salesUsers, ...managerUsers];
        const deduped = Array.from(new Map(combined.map((u) => [u._id, u])).values());
        setAssignableUsers(deduped);
      }

      setCustomers(customersData);
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
      if (!multiAssignedEnabled && selectedAssignedUsers.length > 1) {
        setSnackbar({
          open: true,
          message: "Modo exclusivo activo: solo puedes asignar 1 usuario por cliente.",
          severity: "error",
        });
        return;
      }

      if (selectedAssignedUsers.length === 0) {
        setSnackbar({
          open: true,
          message: "Debes seleccionar al menos un usuario.",
          severity: "error",
        });
        return;
      }

      const customerIds = Array.from(selectedIds);
      await batchAssignSales(customerIds, selectedAssignedUsers);
      setSnackbar({ open: true, message: "Usuarios asignados correctamente", severity: "success" });
      setAssignDialogOpen(false);
      setSelectedAssignedUsers([]);
      setSelectedIds(new Set());
      fetchData();
    } catch (error: any) {
      let errorMessage = "Error al asignar usuarios";
      if (error.response?.status === 404) {
        errorMessage = "Usuarios no encontrados o sin rol SALES/MANAGER";
      } else if (error.response?.status === 403) {
        errorMessage = "Modo exclusivo activo — solo se permite 1 usuario por cliente";
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

  const getUserRoleBadge = (user: User) => {
    const isSales = user.roles?.includes("SALES");
    const isManager = user.roles?.includes("MANAGER");
    if (isManager) return { label: "MANAGER", color: theme.palette.warning.main };
    if (isSales) return { label: "SALES", color: theme.palette.primary.main };
    return { label: "OTRO", color: theme.palette.text.secondary };
  };

  const selectedCount = selectedIds.size;

  // Para pasar a CustomerList — lista de SALES para resolución de autoría (sin MANAGER)
  const salesOnlyUsers = assignableUsers.filter((u) => u.roles?.includes("SALES"));

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
          salesUsers={salesOnlyUsers}
          showAuthor={showAuthor}
          onCustomerClick={(customer, index, event) => {
            handleRowClick(customer, index, event);
          }}
          onOpenDrawer={(customer) => {
            setSelectedCustomer(customer);
            setIsNew(false);
            setDrawerOpen(true);
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
                Asignar Usuario
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

      {/* Assign Users Dialog */}
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
        <DialogTitle sx={{ fontWeight: 800, fontSize: "1.25rem" }}>Asignar Usuarios a Clientes</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Selecciona los usuarios (SALES o MANAGER) que quieres asignar a los{" "}
            <strong>{selectedCount}</strong> clientes seleccionados.
          </Typography>
          {!multiAssignedEnabled && (
            <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
              <Typography variant="caption" fontWeight={700}>
                Modo exclusivo activo: solo puedes asignar 1 usuario por cliente.
              </Typography>
            </Alert>
          )}
          <FormControl fullWidth>
            <InputLabel>Usuarios</InputLabel>
            <Select
              multiple
              value={selectedAssignedUsers}
              onChange={(e) => {
                const newVal = e.target.value as string[];
                // Si modo exclusivo, limitar a 1
                if (!multiAssignedEnabled && newVal.length > 1) {
                  setSelectedAssignedUsers([newVal[newVal.length - 1]]);
                } else {
                  setSelectedAssignedUsers(newVal);
                }
              }}
              renderValue={(selected) =>
                selected
                  .map((id) => {
                    const u = assignableUsers.find((u) => u._id === id);
                    return u ? u.name || u.username : id;
                  })
                  .join(", ")
              }
              sx={{ borderRadius: 2 }}
            >
              {assignableUsers.map((user) => {
                const badge = getUserRoleBadge(user);
                return (
                  <MenuItem key={user._id} value={user._id}>
                    <Checkbox checked={selectedAssignedUsers.includes(user._id)} />
                    <ListItemText
                      primary={
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="body2">{user.name || user.username}</Typography>
                          <Chip
                            label={badge.label}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              backgroundColor: alpha(badge.color, 0.12),
                              color: badge.color,
                              border: `1px solid ${alpha(badge.color, 0.3)}`,
                            }}
                          />
                        </Stack>
                      }
                      secondary={user.email}
                    />
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => {
              setAssignDialogOpen(false);
              setSelectedAssignedUsers([]);
            }}
            sx={{ fontWeight: 700 }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleBatchAssign}
            disabled={selectedAssignedUsers.length === 0}
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
