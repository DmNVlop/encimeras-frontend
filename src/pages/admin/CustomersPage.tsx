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
  TablePagination,
  Tooltip,
  IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import CloseIcon from "@mui/icons-material/Close";

import DownloadIcon from "@mui/icons-material/Download";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import AdminPageTitle from "./components/AdminPageTitle";
import CustomerList from "./customers/CustomerList";
import CustomerDrawer from "./customers/CustomerDrawer";
import ExportCsvDialog, { type ExportCsvScope } from "./components/ExportCsvDialog";
import ImportCsvPreviewDialog from "./components/ImportCsvPreviewDialog";
import { type ICustomer, type ICustomerCreate } from "@/interfases/customer.interfase";
import type { User } from "@/interfases/user.interfase";
import { getCustomers, batchDeleteCustomers, batchAssignSales, createCustomer, updateCustomer } from "@/services/customer.service";
import { getUsers } from "@/services/user.service";
import { useAuth } from "@/context/AuthProvider";
import { useFactorySettings } from "@/context/FactorySettingsContext";
import { getPageSizeOptions } from "@/utils/dataGrid.util";
import { parseCsv, buildCsv, downloadCsv, boolToCsvField, csvFieldToBool } from "@/utils/csv.util";

// =============================================================================
// MAPEO DE COLUMNAS CSV — mismo objeto usado para export (3a) e import (3c-1).
// Aplanado: contact.*/address.* con prefijo.
// =============================================================================
const CUSTOMER_CSV_COLUMNS: {
  header: string;
  get: (c: ICustomer) => string;
  set: (row: any, v: string) => void;
}[] = [
  { header: "type", get: (c) => c.type ?? "", set: (row, v) => (row.type = v) },
  { header: "officialName", get: (c) => c.officialName ?? "", set: (row, v) => (row.officialName = v) },
  { header: "firstName", get: (c) => c.firstName ?? "", set: (row, v) => (row.firstName = v) },
  { header: "lastName", get: (c) => c.lastName ?? "", set: (row, v) => (row.lastName = v) },
  { header: "commercialName", get: (c) => c.commercialName ?? "", set: (row, v) => (row.commercialName = v) },
  { header: "description", get: (c) => c.description ?? "", set: (row, v) => (row.description = v) },
  { header: "nif", get: (c) => c.nif ?? "", set: (row, v) => (row.nif = v) },
  { header: "isActive", get: (c) => boolToCsvField(c.isActive), set: (row, v) => (row.isActive = csvFieldToBool(v)) },
  { header: "contact_phone", get: (c) => c.contact?.phone ?? "", set: (row, v) => (row.contact.phone = v) },
  { header: "contact_email", get: (c) => c.contact?.email ?? "", set: (row, v) => (row.contact.email = v) },
  { header: "contact_website", get: (c) => c.contact?.website ?? "", set: (row, v) => (row.contact.website = v) },
  { header: "address_country", get: (c) => c.address?.country ?? "", set: (row, v) => (row.address.country = v) },
  { header: "address_fullName", get: (c) => c.address?.fullName ?? "", set: (row, v) => (row.address.fullName = v) },
  { header: "address_addressLine1", get: (c) => c.address?.addressLine1 ?? "", set: (row, v) => (row.address.addressLine1 = v) },
  { header: "address_addressLine2", get: (c) => c.address?.addressLine2 ?? "", set: (row, v) => (row.address.addressLine2 = v) },
  { header: "address_city", get: (c) => c.address?.city ?? "", set: (row, v) => (row.address.city = v) },
  { header: "address_region", get: (c) => c.address?.region ?? "", set: (row, v) => (row.address.region = v) },
  { header: "address_cp", get: (c) => c.address?.cp ?? "", set: (row, v) => (row.address.cp = v) },
];

// Campos ofrecidos como "key" de match para decidir crear vs actualizar en el import (3c-1).
export type CustomerImportKey = "nif" | "officialName" | "contact_email";

export const CUSTOMER_IMPORT_KEY_OPTIONS: { value: CustomerImportKey; label: string; getValue: (c: ICustomer) => string }[] = [
  { value: "nif", label: "NIF/CIF", getValue: (c) => (c.nif ?? "").trim().toLowerCase() },
  { value: "officialName", label: "Nombre oficial", getValue: (c) => (c.officialName ?? "").trim().toLowerCase() },
  { value: "contact_email", label: "Email de contacto", getValue: (c) => (c.contact?.email ?? "").trim().toLowerCase() },
];

export type CustomerImportRowAction = "create" | "update" | "ambiguous";

export interface CustomerImportRow {
  rowIndex: number; // índice de fila dentro del CSV (1-based, sin contar header), para mensajes de error legibles
  data: Partial<ICustomer>;
  keyValue: string;
  action: CustomerImportRowAction;
  matchedCustomer?: ICustomer; // solo si action === "update"
  matchCount: number; // 0 = create, 1 = update, 2+ = ambiguous
}

/**
 * Clasifica en memoria cada fila del CSV parseado contra los customers ya cargados,
 * sin llamar al backend (3c-1). keyOption determina qué campo compara. Filas con
 * keyValue vacío siempre se tratan como alta nueva (no hay forma de matchear "vacío"
 * de forma no ambigua contra potenciales otros vacíos).
 */
export function classifyCustomerImportRows(headerRow: string[], dataRows: string[][], existingCustomers: ICustomer[], keyOption: CustomerImportKey): CustomerImportRow[] {
  const keyConfig = CUSTOMER_IMPORT_KEY_OPTIONS.find((k) => k.value === keyOption)!;

  return dataRows.map((values, i) => {
    const data: any = { contact: {}, address: {} };
    CUSTOMER_CSV_COLUMNS.forEach((col) => {
      const idx = headerRow.indexOf(col.header);
      if (idx !== -1) col.set(data, values[idx] ?? "");
    });

    // Campos opcionales vacíos se omiten en vez de mandar "" — el backend valida
    // formato (IsUrl/IsEmail) sobre el valor presente, y "" no pasa esas validaciones
    // aunque el campo sea @IsOptional (IsOptional solo exime undefined/null).
    (["firstName", "lastName", "commercialName", "description", "nif"] as const).forEach((field) => {
      if (data[field] === "") delete data[field];
    });
    (["phone", "email", "website"] as const).forEach((field) => {
      if (data.contact[field] === "") delete data.contact[field];
    });
    (["country", "fullName", "addressLine1", "addressLine2", "city", "region", "cp"] as const).forEach((field) => {
      if (data.address[field] === "") delete data.address[field];
    });
    if (Object.keys(data.contact).length === 0) delete data.contact;
    if (Object.keys(data.address).length === 0) delete data.address;

    const keyValue = keyConfig.getValue(data as ICustomer);
    const matches = keyValue ? existingCustomers.filter((c) => keyConfig.getValue(c) === keyValue) : [];

    let action: CustomerImportRowAction;
    if (!keyValue || matches.length === 0) action = "create";
    else if (matches.length === 1) action = "update";
    else action = "ambiguous";

    return {
      rowIndex: i + 1,
      data,
      keyValue,
      action,
      matchedCustomer: matches.length === 1 ? matches[0] : undefined,
      matchCount: matches.length,
    };
  });
}

const CustomersPage: React.FC = () => {
  const theme = useTheme();
  const { user: currentUser } = useAuth();
  const { settings } = useFactorySettings();
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<ICustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // Import CSV state (3c-1/3c-2: parseo + clasificación en memoria + preview, sin llamar
  // al backend todavía — la ejecución real queda para 3c-3).
  const [importKey, setImportKey] = useState<CustomerImportKey>("nif");
  const [importRows, setImportRows] = useState<CustomerImportRow[] | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importExecuting, setImportExecuting] = useState(false);
  const [importFileHeaderRow, setImportFileHeaderRow] = useState<string[] | null>(null);
  const [importFileDataRows, setImportFileDataRows] = useState<string[][] | null>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);

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
    setPage(0);
  }, [search, typeFilter, customers]);

  useEffect(() => {
    const validOptions = getPageSizeOptions(filteredCustomers.length);
    if (!validOptions.includes(pageSize)) {
      setPageSize(validOptions[0]);
    }
  }, [filteredCustomers.length, pageSize]);

  const pagedCustomers = filteredCustomers.slice(page * pageSize, page * pageSize + pageSize);

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
    (customer: ICustomer, _pagedIndex: number, event: React.MouseEvent) => {
      const id = customer._id || "";
      // índice absoluto dentro de filteredCustomers (no relativo a la página actual)
      // para que el shift-range tenga sentido aunque el rango cruce límites de página.
      const index = filteredCustomers.findIndex((c) => (c._id || "") === id);

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
        const idsToSelect = visibleOnly ? pagedCustomers.map((c) => c._id || "") : customers.map((c) => c._id || "");
        setSelectedIds(new Set(idsToSelect));
      } else {
        setSelectedIds(new Set());
      }
    },
    [pagedCustomers, customers],
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

  // Sin apiRef/GridFilterModel (no hay DataGrid) — se arma a mano a partir de search/typeFilter.
  const filterDescription: string | null = (() => {
    const parts: string[] = [];
    if (search.trim()) parts.push(`búsqueda contiene "${search.trim()}"`);
    if (typeFilter !== "ALL") parts.push(`tipo = "${typeFilter}"`);
    return parts.length > 0 ? parts.join(" Y ") : null;
  })();

  const exportCustomers = (customersToExport: ICustomer[], selectedHeaders: string[]) => {
    const columns = CUSTOMER_CSV_COLUMNS.filter((col) => selectedHeaders.includes(col.header));
    const headers = columns.map((col) => col.header);
    const rows = customersToExport.map((c) => {
      const row: Record<string, string> = {};
      columns.forEach((col) => (row[col.header] = col.get(c)));
      return row;
    });
    downloadCsv("clientes.csv", buildCsv(headers, rows));
  };

  const handleConfirmExport = (scope: ExportCsvScope, selectedHeaders: string[]) => {
    const source = scope === "all" ? customers : scope === "filtered" ? filteredCustomers : pagedCustomers;
    exportCustomers(source, selectedHeaders);
  };

  // Import CSV (3c-1/3c-2): parsea el archivo, clasifica cada fila (crear/actualizar/
  // ambiguo) en memoria contra `customers` ya cargados y abre el modal de preview.
  // No llama al backend todavía — eso es 3c-3, pendiente.
  const handleImportFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCsv(text, ";");
      const headerRow = rows.shift();
      if (!headerRow) {
        alert("El archivo CSV está vacío o no tiene cabecera.");
        return;
      }

      setImportFileHeaderRow(headerRow);
      setImportFileDataRows(rows);
      setImportRows(classifyCustomerImportRows(headerRow, rows, customers, importKey));
      setImportDialogOpen(true);
    };
    reader.readAsText(file);
    if (event.target) event.target.value = ""; // Reset input
  };

  const handleImportKeyChange = (key: CustomerImportKey) => {
    setImportKey(key);
    if (importFileHeaderRow && importFileDataRows) {
      setImportRows(classifyCustomerImportRows(importFileHeaderRow, importFileDataRows, customers, key));
    }
  };

  const handleCloseImportDialog = () => {
    setImportDialogOpen(false);
    setImportRows(null);
    setImportFileHeaderRow(null);
    setImportFileDataRows(null);
  };

  // 3c-3: ejecución real. Ambiguous ya viene resuelto como "create" desde 3c-1
  // (nunca se actualiza a ciegas ante match ambiguo). Errores por fila no abortan
  // el resto — se reportan todos al final (Promise.allSettled, mismo patrón que Materials).
  const handleConfirmImport = async () => {
    if (!importRows || importRows.length === 0) return;
    setImportExecuting(true);

    const results = await Promise.allSettled(
      importRows.map((row) => {
        if (row.action === "update" && row.matchedCustomer?._id) {
          return updateCustomer(row.matchedCustomer._id, row.data);
        }
        return createCustomer(row.data as ICustomerCreate);
      }),
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results
      .map((r, i) => ({ r, row: importRows[i] }))
      .filter(({ r }) => r.status === "rejected") as { r: PromiseRejectedResult; row: CustomerImportRow }[];

    setImportExecuting(false);
    handleCloseImportDialog();
    fetchData();

    if (failed.length === 0) {
      setSnackbar({ open: true, message: `Importación completa: ${succeeded} clientes procesados.`, severity: "success" });
    } else {
      const detail = failed.map(({ row }) => `fila ${row.rowIndex}`).join(", ");
      setSnackbar({
        open: true,
        message: `Importación parcial: ${succeeded} ok, ${failed.length} con error (${detail}). Ver consola.`,
        severity: "error",
      });
      console.error(
        "Errores en import CSV de Customers:",
        failed.map(({ row, r }) => ({ rowIndex: row.rowIndex, error: (r as PromiseRejectedResult).reason })),
      );
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
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", md: "flex-end" }} sx={{ mb: 2 }} spacing={1.5}>
        <Box>
          <AdminPageTitle>Directorio de Clientes</AdminPageTitle>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5, opacity: 0.8 }}>
            Gestiona empresas y particulares activos.
          </Typography>
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }} sx={{ width: { xs: "100%", md: "auto" } }}>
          {/* Type Filter */}
          <Box sx={{ width: { xs: "100%", sm: 140 } }}>
            <Select
              fullWidth
              size="small"
              value={typeFilter}
              onChange={(e: SelectChangeEvent) => setTypeFilter(e.target.value)}
            >
              <MenuItem value="ALL">Todos</MenuItem>
              <MenuItem value="COMPANY">Empresas</MenuItem>
              <MenuItem value="INDIVIDUAL">Particulares</MenuItem>
            </Select>
          </Box>

          {/* Filter Bar */}
          <Box sx={{ width: { xs: "100%", sm: 220, md: 300 } }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "text.secondary", opacity: 0.5, fontSize: "1.1rem" }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Tooltip title="Exportar clientes a CSV">
            <Button size="small" variant="outlined" startIcon={<DownloadIcon />} onClick={() => setExportDialogOpen(true)} sx={{ whiteSpace: "nowrap" }}>
              Exportar CSV
            </Button>
          </Tooltip>

          <input ref={importFileInputRef} type="file" accept=".csv" hidden onChange={handleImportFileSelected} />
          <Tooltip title="Importar clientes desde CSV">
            <Button size="small" variant="outlined" startIcon={<UploadFileIcon />} onClick={() => importFileInputRef.current?.click()} sx={{ whiteSpace: "nowrap" }}>
              Importar CSV
            </Button>
          </Tooltip>

          <Tooltip title="Crear un nuevo cliente">
            <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={handleCreateNew} sx={{ whiteSpace: "nowrap" }}>
              Nuevo Cliente
            </Button>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Main List Container */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 4,
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          background: alpha(theme.palette.background.paper, 0.3),
          backdropFilter: "blur(20px)",
        }}
      >
        <CustomerList
          customers={pagedCustomers}
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

        <TablePagination
          component="div"
          count={filteredCustomers.length}
          page={page}
          onPageChange={(_e, newPage) => setPage(newPage)}
          rowsPerPage={pageSize}
          onRowsPerPageChange={(e) => {
            setPageSize(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={getPageSizeOptions(filteredCustomers.length)}
          labelRowsPerPage="Clientes por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
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
            px: 2,
            py: 1,
            borderRadius: 3,
            background: alpha(theme.palette.background.paper, 0.95),
            backdropFilter: "blur(20px)",
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            boxShadow: `0 12px 40px -12px ${alpha(theme.palette.common.black, 0.4)}`,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            zIndex: 1200,
          }}
        >
          <Chip
            size="small"
            label={`${selectedCount} cliente${selectedCount !== 1 ? "s" : ""} seleccionado${selectedCount !== 1 ? "s" : ""}`}
            sx={{
              fontWeight: 700,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          />
          <Box sx={{ display: "flex", gap: 1 }}>
            {isAdminOrOwner && (
              <Tooltip title="Asignar usuario a los clientes seleccionados">
                <Button size="small" variant="outlined" startIcon={<PersonAddIcon />} onClick={() => setAssignDialogOpen(true)}>
                  Asignar Usuario
                </Button>
              </Tooltip>
            )}
            <Tooltip title="Eliminar clientes seleccionados">
              <Button size="small" variant="outlined" color="error" startIcon={<DeleteOutlineIcon />} onClick={() => setDeleteDialogOpen(true)}>
                Eliminar
              </Button>
            </Tooltip>
          </Box>
          <Tooltip title="Cerrar selección">
            <IconButton size="small" onClick={() => setSelectedIds(new Set())} sx={{ color: "text.secondary" }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
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
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button
            size="small"
            onClick={() => {
              setAssignDialogOpen(false);
              setSelectedAssignedUsers([]);
            }}
          >
            Cancelar
          </Button>
          <Button size="small" variant="contained" onClick={handleBatchAssign} disabled={selectedAssignedUsers.length === 0}>
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
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button size="small" onClick={() => setDeleteDialogOpen(false)}>
            Cancelar
          </Button>
          <Button size="small" variant="contained" color="error" onClick={handleBatchDelete}>
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

      {/* Export CSV Dialog */}
      <ExportCsvDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        onConfirm={handleConfirmExport}
        pageCount={pagedCustomers.length}
        filteredCount={filteredCustomers.length}
        totalCount={customers.length}
        filterDescription={filterDescription}
        availableColumns={CUSTOMER_CSV_COLUMNS.map((col) => col.header)}
      />

      {/* Import CSV Preview Dialog (3c-1/3c-2) */}
      <ImportCsvPreviewDialog
        open={importDialogOpen}
        onClose={handleCloseImportDialog}
        onConfirm={handleConfirmImport}
        importKey={importKey}
        onImportKeyChange={handleImportKeyChange}
        rows={importRows}
        executing={importExecuting}
      />

      {/* Details Drawer */}
      <CustomerDrawer open={drawerOpen} customer={selectedCustomer} isNew={isNew} onClose={handleCloseDrawer} onRefresh={fetchData} />
    </Box>
  );
};

export default CustomersPage;
