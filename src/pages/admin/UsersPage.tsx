// src/pages/admin/UsersPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Chip,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Typography,
  Stack,
  Paper,
  Snackbar,
  Alert,
  Tooltip,
  IconButton,
} from "@mui/material";
import { DataGrid, type GridColDef, GridActionsCellItem, type GridRowId, type GridRowSelectionModel } from "@mui/x-data-grid";
import { esES } from "@mui/x-data-grid/locales";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import InfoIcon from "@mui/icons-material/Info";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import BusinessIcon from "@mui/icons-material/Business";
import SellIcon from "@mui/icons-material/Sell";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { Role, type User } from "@/interfases/user.interfase";
import AdminPageTitle from "./components/AdminPageTitle";
import UserModal from "./components/users/UserModal";
import TransferOwnerDialog from "./components/users/TransferOwnerDialog";
import ConfirmDeleteDialog from "./components/users/ConfirmDeleteDialog";
import { ApiErrorFeedback } from "../public/common/ApiErrorFeedback";
import { useAuth } from "@/context/AuthProvider";
import { getUsers, getManagedUsers, deleteUser, batchDeleteUsers, createUser, updateUser } from "@/services/user.service";

const UsersPage: React.FC = () => {
  const { user: currentAuthUser } = useAuth();
  const [allUsers, setAllUsers] = useState<User[]>([]); // Complete list of all users
  const [users, setUsers] = useState<User[]>([]); // Users after initial filtering
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState<Partial<User>>({});
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [error, setError] = useState<any>(null);

  // Filtros y búsqueda
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [managedOnlyFilter, setManagedOnlyFilter] = useState(false);

  // Selección múltiple
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>({
    type: "include",
    ids: new Set<GridRowId>(),
  });

  // Modales
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const isOwner = currentAuthUser?.roles.includes("OWNER");
  const isManager = currentAuthUser?.roles.includes("MANAGER");
  const isAdmin = currentAuthUser?.roles.includes("ADMIN");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data: User[];

      if (isOwner && managedOnlyFilter) {
        // OWNER usando filtro "Solo mis SALES"
        data = await getManagedUsers();
      } else {
        // Todos los usuarios o filtro por rol
        data = await getUsers({ role: roleFilter !== "ALL" ? roleFilter : undefined });
      }

      // Filtrar usuarios que no tengan _id para evitar errores en DataGrid
      const validUsers = data.filter((user) => !!user._id);
      const invalidUsers = data.filter((user) => !user._id);
      if (invalidUsers.length > 0) {
        console.warn(`${invalidUsers.length} usuarios sin _id recibidos:`, invalidUsers);
      }
      // Always update allUsers with the complete list
      setAllUsers(validUsers);
      setUsers(validUsers);
      setFilteredUsers(validUsers); // Inicialmente mostrar todos
    } catch (err) {
      console.error("Error loading users:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [isOwner, managedOnlyFilter, roleFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Filtrado local (búsqueda)
  useEffect(() => {
    const term = search.toLowerCase();
    const filtered = users
      .filter((user) => !!user._id) // Filtrar usuarios sin _id para evitar errores
      .filter((user) => {
        const matchesSearch =
          user.username.toLowerCase().includes(term) ||
          (user.name && user.name.toLowerCase().includes(term)) ||
          (user.email && user.email.toLowerCase().includes(term));

        // Filtro por rol (ya se aplica en loadUsers, pero mantenemos por si hay cambio de filtro)
        const matchesRole = roleFilter === "ALL" || user.roles.includes(roleFilter as Role);

        // Si OWNER y managedOnlyFilter activo, filtrar solo sus SALES
        const matchesManaged = !managedOnlyFilter || (user.ownerId === currentAuthUser?.id && user.roles.includes(Role.SALES));

        return matchesSearch && matchesRole && matchesManaged;
      });

    setFilteredUsers(filtered);
  }, [search, users, roleFilter, managedOnlyFilter, currentAuthUser]);

  const handleOpen = (user?: User) => {
    setIsEditMode(!!user);
    setCurrentUser(user || {});
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este usuario?")) {
      try {
        await deleteUser(id);
        loadUsers();
        setSnackbar({ open: true, message: "Usuario eliminado exitosamente", severity: "success" });
      } catch (err) {
        console.error("Error deleting user:", err);
        setError(err);
        setSnackbar({ open: true, message: "Error al eliminar usuario", severity: "error" });
      }
    }
  };

  const handleBatchDelete = async () => {
    const selectedCount = selectionModel.ids.size;
    if (window.confirm(`¿Estás seguro de que quieres eliminar ${selectedCount} usuario(s)?`)) {
      try {
        await batchDeleteUsers(Array.from(selectionModel.ids) as string[]);
        setSelectionModel({ type: "include", ids: new Set<GridRowId>() });
        loadUsers();
        setDeleteDialogOpen(false);
        setSnackbar({ open: true, message: `${selectedCount} usuario(s) eliminados exitosamente`, severity: "success" });
      } catch (err) {
        console.error("Error deleting users:", err);
        setSnackbar({ open: true, message: "Error al eliminar usuarios", severity: "error" });
      }
    }
  };

  const handleSubmit = async (data: Partial<User>) => {
    try {
      if (isEditMode && currentUser._id) {
        await updateUser(currentUser._id, data);
        setSnackbar({ open: true, message: "Usuario actualizado exitosamente", severity: "success" });
      } else {
        await createUser(data);
        setSnackbar({ open: true, message: "Usuario creado exitosamente", severity: "success" });
      }
      setError(null);
      loadUsers();
      handleClose();
    } catch (err) {
      console.error("Error saving user:", err);
      setError(err);
      if (typeof err === "object" && err !== null && "statusCode" in err) {
        const backendError = err as any;
        if (backendError.statusCode === 409) {
          setSnackbar({ open: true, message: "El nombre de usuario ya está en uso", severity: "error" });
        } else {
          setSnackbar({ open: true, message: "Error al guardar usuario", severity: "error" });
        }
      } else {
        setSnackbar({ open: true, message: "Error al guardar usuario", severity: "error" });
      }
    }
  };

  const columns: GridColDef<User>[] = [
    { field: "username", headerName: "Usuario", width: 150 },
    { field: "name", headerName: "Nombre", width: 200 },
    { field: "email", headerName: "Email", width: 200 },
    {
      field: "roles",
      headerName: "Roles",
      width: 280,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", alignItems: "center", height: "100%" }}>
          {params.value?.map((role: string) => (
            <Chip
              key={role}
              label={role}
              size="small"
              variant="outlined"
              color={role === "ADMIN" ? "error" : role === "OWNER" ? "secondary" : role === "MANAGER" ? "warning" : role === "SALES" ? "success" : "default"}
              icon={role === "ADMIN" ? <AdminPanelSettingsIcon /> : role === "OWNER" ? <BusinessIcon /> : role === "SALES" ? <SellIcon /> : undefined}
            />
          ))}
        </Box>
      ),
    },
    {
      field: "ownerId",
      headerName: "Gestionado por",
      width: 200,
      renderCell: (params) => {
        if (!params.value) return <Chip label="N/A" size="small" />;

        const owner = allUsers.find((u) => u._id === params.value);
        return <Chip label={owner?.name || owner?.username || "Unknown"} size="small" variant="outlined" color="secondary" icon={<PersonIcon />} />;
      },
    },
    {
      field: "createdBy",
      headerName: "Creado por",
      width: 180,
      renderCell: (params) => {
        const creator = allUsers.find((u) => u._id === params.value);
        return creator ? creator.name || creator.username : "-";
      },
    },
    {
      field: "factoryId",
      headerName: "Factory ID",
      width: 180,
      renderCell: (params) => <Chip label={params.value || "-"} size="small" variant="outlined" color={params.value ? "info" : "default"} />,
    },
    {
      field: "createdAt",
      headerName: "Creado",
      width: 180,
      valueFormatter: (value) => (value ? new Date(value).toLocaleString() : ""),
    },
    {
      field: "hierarchy",
      headerName: "Info",
      width: 60,
      renderCell: (params) => {
        const user = params.row as User;
        const owner = allUsers.find((u) => u._id === user.ownerId);
        const creator = allUsers.find((u) => u._id === user.createdBy);

        return (
          <Tooltip
            title={
              <Box sx={{ p: 1 }}>
                <Typography variant="caption" display="block">
                  <strong>Creado por:</strong> {creator?.name || creator?.username || "N/A"}
                </Typography>
                {user.ownerId && (
                  <Typography variant="caption" display="block">
                    <strong>Gestionado por:</strong> {owner?.name || owner?.username}
                  </Typography>
                )}
                <Typography variant="caption" display="block">
                  <strong>Factory:</strong> {user.factoryId || "N/A"}
                </Typography>
              </Box>
            }
            arrow
          >
            <IconButton size="small">
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        );
      },
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Acciones",
      width: 120,
      getActions: (params) => [
        <GridActionsCellItem icon={<EditIcon />} label="Editar" onClick={() => handleOpen(params.row)} />,
        <GridActionsCellItem icon={<DeleteIcon />} label="Eliminar" onClick={() => handleDelete(params.id as string)} />,
      ],
    },
  ];

  const selectedUsersList = users.filter((u) => selectionModel.ids.has(u._id));

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <AdminPageTitle>Gestión de Usuarios</AdminPageTitle>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Añadir Usuario
        </Button>
      </Box>

      <ApiErrorFeedback error={error} title="Error en Gestión de Usuarios" onRetry={loadUsers} />

      {/* Barra de filtros */}
      <Box sx={{ mb: 2, display: "flex", gap: 2, alignItems: "center" }}>
        <TextField
          placeholder="Buscar por nombre, username, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1 }}
        />

        <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} sx={{ minWidth: 150 }}>
          <MenuItem value="ALL">Todos los roles</MenuItem>
          {Object.values(Role).map((role) => (
            <MenuItem key={role} value={role}>
              {role}
            </MenuItem>
          ))}
        </Select>

        {(isOwner || isManager) && (
          <FormControlLabel
            control={<Checkbox checked={managedOnlyFilter} onChange={(e) => setManagedOnlyFilter(e.target.checked)} />}
            label={isManager ? "Solo mis gestionados" : "Solo mis SALES"}
          />
        )}
      </Box>

      {/* Barra de acciones masivas */}
      {selectionModel.ids.size > 0 && (
        <Paper sx={{ mb: 2, p: 2, bgcolor: "primary.light", borderRadius: 1 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {selectionModel.ids.size} usuario(s) seleccionado(s)
          </Typography>
          <Stack direction="row" spacing={2}>
            {isAdmin && (
              <Button
                variant="contained"
                startIcon={<SwapHorizIcon />}
                onClick={() => setTransferDialogOpen(true)}
                disabled={selectedUsersList.every((u) => !u.roles.includes(Role.SALES) && !u.roles.includes(Role.MANAGER))}
              >
                Transferir Ownership
              </Button>
            )}
            <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={handleBatchDelete}>
              Eliminar Seleccionados
            </Button>
            <Button variant="text" onClick={() => setSelectionModel({ type: "include", ids: new Set<GridRowId>() })}>
              Limpiar Selección
            </Button>
          </Stack>
        </Paper>
      )}

      {/* DataGrid */}
      <Box sx={{ height: "calc(100vh - 250px)", width: "100%" }}>
        <DataGrid
          rows={filteredUsers}
          columns={columns}
          getRowId={(row) => row._id || `temp-${Math.random()}`}
          loading={loading}
          localeText={esES.components.MuiDataGrid.defaultProps.localeText}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50]}
          checkboxSelection
          onRowSelectionModelChange={setSelectionModel}
          rowSelectionModel={selectionModel}
        />
      </Box>

      {/* Modales */}
      <UserModal open={open} onClose={handleClose} onSubmit={handleSubmit} user={currentUser} isEditMode={isEditMode} />

      <TransferOwnerDialog
        open={transferDialogOpen}
        onClose={() => setTransferDialogOpen(false)}
        userIds={Array.from(selectionModel.ids) as string[]}
        users={allUsers}
        onTransferComplete={() => {
          loadUsers();
          setSelectionModel({ type: "include", ids: new Set<GridRowId>() });
          setSnackbar({ open: true, message: "Usuarios transferidos exitosamente", severity: "success" });
        }}
      />

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleBatchDelete}
        title="Confirmar Eliminación Masiva"
        message={`¿Estás seguro de que quieres eliminar ${selectionModel.ids.size} usuario(s)? Esta acción no se puede deshacer.`}
        count={selectionModel.ids.size}
      />

      {/* Snackbar para feedback */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UsersPage;
