// src/pages/admin/UsersPage.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Box, Button, Chip, TextField, InputAdornment, Typography, Stack, Paper, Snackbar, Alert, Tooltip, IconButton, Tab, Tabs, Badge } from "@mui/material";
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
import EngineeringIcon from "@mui/icons-material/Engineering";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import DownloadIcon from "@mui/icons-material/Download";
import UploadFileIcon from "@mui/icons-material/UploadFile";

import { useSearchParams } from "react-router-dom";
import { Role, type User } from "@/interfases/user.interfase";
import AdminPageTitle from "./components/AdminPageTitle";
import UserModal from "./components/users/UserModal";
import AssignManagerDialog from "./components/users/AssignManagerDialog";
import ConfirmDeleteDialog from "./components/users/ConfirmDeleteDialog";
import ExportCsvDialog, { type ExportCsvScope } from "./components/ExportCsvDialog";
import CsvHelpButton from "./components/CsvHelpButton";
import { ApiErrorFeedback } from "../public/common/ApiErrorFeedback";
import { useAuth } from "@/context/AuthProvider";
import { getUsers, getManagedUsers, deleteUser, batchDeleteUsers, createUser, updateUser } from "@/services/user.service";
import { arrayToCsvField, buildCsv, downloadCsv, parseCsv, csvFieldToArray } from "@/utils/csv.util";

// =============================================================================
// MAPEO DE COLUMNAS CSV — mismo objeto usado para import y export (paridad con Materials)
// =============================================================================

export const USER_CSV_COLUMNS: {
  header: string;
  get: (u: User) => string;
}[] = [
  { header: "username", get: (u) => u.username ?? "" },
  { header: "name", get: (u) => u.name ?? "" },
  { header: "email", get: (u) => u.email ?? "" },
  { header: "phone", get: (u) => u.phone ?? "" },
  { header: "roles", get: (u) => arrayToCsvField(u.roles) },
  { header: "managerId", get: (u) => u.managerId ?? "" },
  { header: "ownerId", get: (u) => u.ownerId ?? "" },
  { header: "factoryId", get: (u) => u.factoryId ?? "" },
  { header: "createdAt", get: (u) => u.createdAt ?? "" },
  { header: "createdBy", get: (u) => u.createdBy ?? "" },
];

const ROLE_TAB_CONFIG = [
  {
    label: "Todos",
    value: "ALL",
    color: undefined as "default" | "error" | "warning" | "success" | "info" | "secondary" | undefined,
    icon: <PersonOutlineIcon fontSize="small" />,
  },
  { label: "Admin", value: Role.ADMIN, color: "error" as const, icon: <AdminPanelSettingsIcon fontSize="small" /> },
  { label: "Owner", value: Role.OWNER, color: "secondary" as const, icon: <BusinessIcon fontSize="small" /> },
  { label: "Manager", value: Role.MANAGER, color: "warning" as const, icon: <ManageAccountsIcon fontSize="small" /> },
  { label: "Sales", value: Role.SALES, color: "success" as const, icon: <SellIcon fontSize="small" /> },
  { label: "User", value: Role.USER, color: "default" as const, icon: <PersonIcon fontSize="small" /> },
  { label: "Worker", value: Role.WORKER, color: "info" as const, icon: <EngineeringIcon fontSize="small" /> },
];

const ROLE_COLORS: Record<string, "default" | "error" | "warning" | "success" | "info" | "secondary"> = {
  ADMIN: "error",
  OWNER: "secondary",
  MANAGER: "warning",
  SALES: "success",
  WORKER: "info",
  USER: "default",
};

const UsersPage: React.FC = () => {
  const { user: currentAuthUser } = useAuth();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState<Partial<User>>({});
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [error, setError] = useState<any>(null);

  const [search, setSearch] = useState("");

  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>({
    type: "include",
    ids: new Set<GridRowId>(),
  });

  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const roleTab = searchParams.get("role") ?? "ALL";

  const setRoleTab = (value: string) => {
    setPaginationModel((p) => ({ ...p, page: 0 }));
    if (value === "ALL") {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ role: value }, { replace: true });
    }
  };

  const currentRoles = currentAuthUser?.roles ?? [];
  const isAdmin = currentRoles.includes("ADMIN");
  const isOwner = currentRoles.includes("OWNER");
  const isManager = currentRoles.includes("MANAGER");

  // Roles que el usuario actual puede crear/importar — mismo criterio que UserModal
  const importableRoles: Role[] = isAdmin
    ? Object.values(Role)
    : isOwner
      ? [Role.MANAGER, Role.SALES, Role.WORKER, Role.USER]
      : isManager
        ? [Role.SALES, Role.WORKER, Role.USER]
        : [Role.USER];

  // ADMIN: todos los tabs. OWNER: Manager/Sales/Worker/User + "Todos". MANAGER: Sales + "Todos". Resto: solo "Todos".
  const OWNER_TABS = new Set([Role.MANAGER, Role.SALES, Role.WORKER, Role.USER] as string[]);
  const visibleTabs = ROLE_TAB_CONFIG.filter((tab) => {
    if (isAdmin) return true;
    if (tab.value === "ALL") return true;
    if (isOwner) return OWNER_TABS.has(tab.value);
    if (isManager) return tab.value === Role.SALES;
    return false;
  });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // MANAGER: usa /users/managed (solo sus SALES)
      // SALES/WORKER/USER: GET /users devuelve solo su propio perfil
      // OWNER/ADMIN: GET /users con scope completo
      const data = isManager ? await getManagedUsers() : await getUsers({});
      const validUsers = data.filter((u) => !!u._id);
      // MANAGER no aparece en getManagedUsers() — añadirlo para que el lookup de manager en columnas funcione
      const usersWithSelf =
        isManager && currentAuthUser && !validUsers.find((u) => u._id === currentAuthUser._id)
          ? [currentAuthUser as User, ...validUsers]
          : validUsers;
      setAllUsers(usersWithSelf);
      setUsers(validUsers);
      setFilteredUsers(validUsers);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [isManager, currentAuthUser]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    const term = search.toLowerCase();
    const filtered = users.filter((u) => {
      if (!u._id) return false;

      const matchesSearch =
        u.username.toLowerCase().includes(term) || (u.name && u.name.toLowerCase().includes(term)) || (u.email && u.email.toLowerCase().includes(term));

      const matchesRole = roleTab === "ALL" || u.roles.includes(roleTab as Role);

      return matchesSearch && matchesRole;
    });
    setFilteredUsers(filtered);
  }, [search, users, roleTab]);

  const countByRole = (role: string) => {
    if (role === "ALL") return users.length;
    return users.filter((u) => u.roles.includes(role as Role)).length;
  };

  const filterParts: string[] = [];
  if (search) filterParts.push(`búsqueda "${search}"`);
  if (roleTab !== "ALL") filterParts.push(`rol ${roleTab}`);
  const filterDescription = filterParts.length > 0 ? filterParts.join(" Y ") : null;

  const exportUsers = (usersToExport: User[]) => {
    const headers = USER_CSV_COLUMNS.map((col) => col.header);
    const rows = usersToExport.map((u) => {
      const row: Record<string, string> = {};
      USER_CSV_COLUMNS.forEach((col) => (row[col.header] = col.get(u)));
      return row;
    });
    downloadCsv("users.csv", buildCsv(headers, rows));
  };

  const handleConfirmExport = (scope: ExportCsvScope) => {
    if (scope === "all") {
      exportUsers(users);
      return;
    }
    if (scope === "filtered") {
      exportUsers(filteredUsers);
      return;
    }
    const { page, pageSize } = paginationModel;
    exportUsers(filteredUsers.slice(page * pageSize, page * pageSize + pageSize));
  };

  const IMPORT_DEFAULT_PASSWORD = "12345678";

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const rows = parseCsv(text, ";");
      const headerRow = rows.shift();
      if (!headerRow) return alert("El archivo CSV está vacío o no tiene cabecera.");

      const requiredHeaders = ["username", "roles"];
      const missingHeaders = requiredHeaders.filter((h) => !headerRow.includes(h));
      if (missingHeaders.length > 0) {
        return alert(`Faltan columnas requeridas en el CSV: ${missingHeaders.join(", ")}`);
      }

      const getField = (values: string[], header: string) => {
        const index = headerRow.indexOf(header);
        return index === -1 ? "" : values[index] ?? "";
      };

      const toCreate: { label: string; user: Partial<User> }[] = [];
      const skipped: string[] = [];

      rows.forEach((values, i) => {
        const username = getField(values, "username");
        const rowRoles = csvFieldToArray(getField(values, "roles")) as Role[];
        const rowLabel = username || `fila ${i + 2}`;

        if (rowRoles.length === 0) {
          skipped.push(`${rowLabel}: sin roles`);
          return;
        }

        const disallowedRoles = rowRoles.filter((r) => !importableRoles.includes(r));
        if (disallowedRoles.length > 0) {
          skipped.push(`${rowLabel}: rol(es) fuera de tu alcance (${disallowedRoles.join(", ")})`);
          return;
        }

        let managerId = getField(values, "managerId") || undefined;
        if (rowRoles.includes(Role.SALES) && !managerId) {
          if (isManager && currentAuthUser?._id) {
            managerId = currentAuthUser._id;
          } else {
            skipped.push(`${rowLabel}: usuario SALES requiere managerId`);
            return;
          }
        }

        const ownerId = getField(values, "ownerId") || undefined;
        if (rowRoles.includes(Role.MANAGER) && !rowRoles.includes(Role.OWNER) && isAdmin && !ownerId) {
          skipped.push(`${rowLabel}: usuario MANAGER requiere ownerId`);
          return;
        }

        // factoryId del CSV se ignora deliberadamente: el backend lo infiere de quien importa
        toCreate.push({
          label: rowLabel,
          user: {
            username,
            name: getField(values, "name") || undefined,
            email: getField(values, "email") || undefined,
            phone: getField(values, "phone") || undefined,
            roles: rowRoles,
            managerId,
            ownerId,
            password: IMPORT_DEFAULT_PASSWORD,
          } as Partial<User>,
        });
      });

      const results = await Promise.allSettled(toCreate.map((item) => createUser(item.user)));

      const created: string[] = [];
      const failed: string[] = [];
      results.forEach((result, i) => {
        const { label } = toCreate[i];
        if (result.status === "fulfilled") {
          created.push(label);
        } else {
          const backendError = result.reason as any;
          const backendMessage = Array.isArray(backendError?.message) ? backendError.message.join(". ") : backendError?.message;
          failed.push(`${label}: ${backendMessage || "error desconocido"}`);
        }
      });

      const parts = [`Creados: ${created.length}`];
      if (failed.length > 0) parts.push(`Fallidos: ${failed.length}`);
      if (skipped.length > 0) parts.push(`Omitidos: ${skipped.length}`);
      let message = parts.join(" | ");
      if (failed.length > 0) message += `\n\nFallidos (rechazados por el servidor):\n${failed.join("\n")}`;
      if (skipped.length > 0) message += `\n\nOmitidos (no se enviaron, ver motivo):\n${skipped.join("\n")}`;
      alert(message);

      if (failed.length > 0) console.error("Filas fallidas al importar usuarios:", failed);
      if (created.length > 0) loadUsers();
    };
    reader.readAsText(file);
    if (event.target) event.target.value = "";
  };

  const handleOpen = (user?: User) => {
    setIsEditMode(!!user);
    setCurrentUser(user || {});
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const canDeleteUser = (target: User): boolean => {
    if (isAdmin) return true;
    if (isOwner) return target.roles.some((r) => ([Role.MANAGER, Role.SALES, Role.WORKER, Role.USER] as string[]).includes(r));
    if (isManager) return target.roles.includes(Role.SALES) && target.managerId === currentAuthUser?._id;
    return false;
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este usuario?")) {
      try {
        await deleteUser(id);
        loadUsers();
        setSnackbar({ open: true, message: "Usuario eliminado exitosamente", severity: "success" });
      } catch (err) {
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
      setError(err);
      const backendError = err as any;
      const backendMessage = Array.isArray(backendError?.message) ? backendError.message.join(". ") : backendError?.message;
      if (backendError?.statusCode === 409) {
        setSnackbar({ open: true, message: "El nombre de usuario ya está en uso", severity: "error" });
      } else if (backendMessage) {
        setSnackbar({ open: true, message: backendMessage, severity: "error" });
      } else {
        setSnackbar({ open: true, message: "Error al guardar usuario", severity: "error" });
      }
    }
  };

  const columns: GridColDef<User>[] = [
    { field: "username", headerName: "Usuario", width: 140 },
    { field: "name", headerName: "Nombre", width: 180 },
    { field: "email", headerName: "Email", width: 200 },
    {
      field: "roles",
      headerName: "Roles",
      width: 260,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", alignItems: "center", height: "100%" }}>
          {params.value?.map((role: string) => (
            <Chip
              key={role}
              label={role}
              size="small"
              variant="filled"
              color={ROLE_COLORS[role] ?? "default"}
              icon={
                role === "ADMIN" ? (
                  <AdminPanelSettingsIcon />
                ) : role === "OWNER" ? (
                  <BusinessIcon />
                ) : role === "MANAGER" ? (
                  <ManageAccountsIcon />
                ) : role === "SALES" ? (
                  <SellIcon />
                ) : role === "WORKER" ? (
                  <EngineeringIcon />
                ) : undefined
              }
              sx={{ fontWeight: 600, fontSize: "0.7rem" }}
            />
          ))}
        </Box>
      ),
    },
    {
      field: "managerId",
      headerName: "Manager",
      width: 180,
      renderCell: (params) => {
        if (!params.value)
          return (
            <Typography variant="caption" color="text.disabled">
              —
            </Typography>
          );
        const manager = allUsers.find((u) => u._id === params.value);
        return <Chip label={manager?.name || manager?.username || "—"} size="small" variant="outlined" color="warning" icon={<ManageAccountsIcon />} />;
      },
    },
    {
      field: "createdBy",
      headerName: "Creado por",
      width: 160,
      renderCell: (params) => {
        const creator = allUsers.find((u) => u._id === params.value);
        return (
          <Typography variant="caption" color="text.secondary">
            {creator ? creator.name || creator.username : "—"}
          </Typography>
        );
      },
    },
    {
      field: "createdAt",
      headerName: "Alta",
      width: 120,
      valueFormatter: (value) => (value ? new Date(value).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }) : ""),
    },
    {
      field: "info",
      headerName: "",
      width: 48,
      sortable: false,
      renderCell: (params) => {
        const u = params.row as User;
        const manager = allUsers.find((x) => x._id === u.managerId);
        const creator = allUsers.find((x) => x._id === u.createdBy);
        return (
          <Tooltip
            title={
              <Box sx={{ p: 0.5 }}>
                <Typography variant="caption" display="block">
                  <strong>Creado por:</strong> {creator?.name || creator?.username || "N/A"}
                </Typography>
                {u.managerId && (
                  <Typography variant="caption" display="block">
                    <strong>Manager:</strong> {manager?.name || manager?.username}
                  </Typography>
                )}
                <Typography variant="caption" display="block">
                  <strong>Factory:</strong> {u.factoryId || "N/A"}
                </Typography>
              </Box>
            }
            arrow
          >
            <IconButton size="small" sx={{ opacity: 0.4, "&:hover": { opacity: 1 } }}>
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
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem icon={<EditIcon />} label="Editar" onClick={() => handleOpen(params.row)} />,
        ...(canDeleteUser(params.row)
          ? [<GridActionsCellItem icon={<DeleteIcon />} label="Eliminar" onClick={() => handleDelete(params.id as string)} />]
          : []),
      ],
    },
  ];

  const selectedUsersList = users.filter((u) => selectionModel.ids.has(u._id));

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <AdminPageTitle>Gestión de Usuarios</AdminPageTitle>
        <Stack direction="row" spacing={1} alignItems="center">
          <input type="file" accept=".csv" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileUpload} />
          <Tooltip title="Importar usuarios desde CSV">
            <IconButton onClick={() => fileInputRef.current?.click()}>
              <UploadFileIcon />
            </IconButton>
          </Tooltip>
          <CsvHelpButton title="Importar / Exportar Usuarios">
            <Typography variant="body2">
              <strong>Exportar</strong> descarga un CSV con todos los datos de los usuarios visibles según tu alcance de permisos (username,
              nombre, email, teléfono, roles, managerId, ownerId, factoryId, fecha de alta y quién lo creó).
            </Typography>
            <Typography variant="body2">
              <strong>Importar</strong> lee un CSV separado por <code>;</code> con al menos las columnas <code>username</code> y{" "}
              <code>roles</code>. Columnas opcionales: <code>name</code>, <code>email</code>, <code>phone</code>, <code>managerId</code>,{" "}
              <code>ownerId</code>. La columna <code>factoryId</code> se ignora aunque esté presente: siempre se asigna la fábrica del usuario
              que importa.
            </Typography>
            <Typography variant="body2">
              <strong>Roles múltiples</strong> van separados por coma en la misma celda, ej: <code>SALES,USER</code>. Solo podés importar roles
              dentro de tu propio alcance (igual que al crear un usuario manualmente): un OWNER puede importar MANAGER/SALES/WORKER/USER, un
              MANAGER solo SALES/WORKER/USER.
            </Typography>
            <Typography variant="body2">
              <strong>Usuarios SALES</strong> necesitan <code>managerId</code> en el CSV si los importa un ADMIN u OWNER. Si los importa un
              MANAGER, se asignan automáticamente a sí mismo.
            </Typography>
            <Typography variant="body2">
              Todos los usuarios importados quedan con la contraseña provisional <code>12345678</code> — deberán cambiarla en su primer acceso.
            </Typography>
            <Typography variant="body2">
              Al finalizar se muestra un resumen con 3 categorías: <strong>Creados</strong> (se guardaron bien), <strong>Fallidos</strong> (el
              servidor los rechazó, ej. email inválido) y <strong>Omitidos</strong> (no se enviaron por estar fuera de tu alcance o faltarles un
              dato obligatorio) — cada fila con su motivo.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ejemplo de fila válida: <code>juan.perez;Juan Pérez;juan@empresa.com;600111222;USER;;;</code>
            </Typography>
          </CsvHelpButton>
          <Tooltip title="Exportar usuarios a CSV">
            <IconButton onClick={() => setExportDialogOpen(true)}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
            Añadir Usuario
          </Button>
        </Stack>
      </Box>

      <ApiErrorFeedback error={error} title="Error en Gestión de Usuarios" onRetry={loadUsers} />

      {/* Tabs por rol */}
      <Paper variant="outlined" sx={{ mb: 2, borderRadius: 2, overflow: "hidden" }}>
        <Tabs
          value={roleTab}
          onChange={(_, v) => setRoleTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 44,
            "& .MuiTab-root": { minHeight: 44, textTransform: "none", fontWeight: 500, fontSize: "0.82rem", gap: 0.5, px: 2 },
          }}
        >
          {visibleTabs.map((tab) => {
            const count = countByRole(tab.value);
            return (
              <Tab
                key={tab.value}
                value={tab.value}
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    {tab.icon}
                    <span>{tab.label}</span>
                    {count > 0 && (
                      <Badge
                        badgeContent={count}
                        color={tab.color ?? "default"}
                        sx={{ "& .MuiBadge-badge": { position: "static", transform: "none", fontSize: "0.65rem", height: 16, minWidth: 16 } }}
                      />
                    )}
                  </Box>
                }
              />
            );
          })}
        </Tabs>
      </Paper>

      {/* Búsqueda */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Buscar por nombre, username o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Acciones masivas */}
      {selectionModel.ids.size > 0 && (
        <Paper sx={{ mb: 2, p: 2, bgcolor: "primary.light", borderRadius: 1 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {selectionModel.ids.size} usuario(s) seleccionado(s)
          </Typography>
          <Stack direction="row" spacing={2}>
            {(isAdmin || currentAuthUser?.roles.includes("OWNER")) && (
              <Button
                variant="contained"
                startIcon={<ManageAccountsIcon />}
                onClick={() => setTransferDialogOpen(true)}
                disabled={selectedUsersList.every((u) => !u.roles.includes(Role.SALES))}
              >
                Asignar Manager
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
      <Box sx={{ height: "calc(100vh - 310px)", width: "100%" }}>
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
          sx={{
            borderRadius: 2,
            "& .MuiDataGrid-row:hover": { bgcolor: "rgba(99,102,241,0.03)" },
            "& .MuiDataGrid-columnHeader": { bgcolor: "rgba(0,0,0,0.02)", fontWeight: 700, fontSize: "0.78rem" },
          }}
        />
      </Box>

      <UserModal open={open} onClose={handleClose} onSubmit={handleSubmit} user={currentUser} isEditMode={isEditMode} />

      <AssignManagerDialog
        open={transferDialogOpen}
        onClose={() => setTransferDialogOpen(false)}
        userIds={Array.from(selectionModel.ids) as string[]}
        users={allUsers}
        allUsers={allUsers}
        onTransferComplete={() => {
          loadUsers();
          setSelectionModel({ type: "include", ids: new Set<GridRowId>() });
          setSnackbar({ open: true, message: "Manager asignado exitosamente", severity: "success" });
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

      <ExportCsvDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        onConfirm={handleConfirmExport}
        pageCount={Math.max(0, Math.min(paginationModel.pageSize, filteredUsers.length - paginationModel.page * paginationModel.pageSize))}
        filteredCount={filteredUsers.length}
        totalCount={users.length}
        filterDescription={filterDescription}
      />

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UsersPage;
