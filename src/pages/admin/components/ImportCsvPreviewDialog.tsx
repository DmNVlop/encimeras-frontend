// src/pages/admin/components/ImportCsvPreviewDialog.tsx
// Modal de preview para el import CSV de Customers (sub-pasos 3c-1/3c-2 del plan
// de mejoras de carga de datos admin). Muestra qué va a pasar (crear/actualizar/
// ambiguo) ANTES de tocar el backend — el usuario confirma o cancela. La ejecución
// real de los create/update queda en 3c-3 (fuera de este componente).
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Alert,
} from "@mui/material";
import type { ICustomer } from "@/interfases/customer.interfase";
import type { CustomerImportKey, CustomerImportRow } from "../CustomersPage";
import { CUSTOMER_IMPORT_KEY_OPTIONS } from "../CustomersPage";

interface ImportCsvPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  importKey: CustomerImportKey;
  onImportKeyChange: (key: CustomerImportKey) => void;
  rows: CustomerImportRow[] | null;
  executing?: boolean;
}

const customerLabel = (c: Partial<ICustomer>) => c.officialName || c.commercialName || "(sin nombre)";

const ImportCsvPreviewDialog: React.FC<ImportCsvPreviewDialogProps> = ({ open, onClose, onConfirm, importKey, onImportKeyChange, rows, executing }) => {
  const toCreate = rows?.filter((r) => r.action === "create") ?? [];
  const toUpdate = rows?.filter((r) => r.action === "update") ?? [];
  const ambiguous = rows?.filter((r) => r.action === "ambiguous") ?? [];

  return (
    <Dialog
      open={open}
      onClose={executing ? undefined : onClose}
      fullWidth
      slotProps={{
        paper: {
          sx: { width: "100%", maxWidth: "900px", height: "100vh", maxHeight: "800px" },
        },
      }}
    >
      <DialogTitle>Vista previa de importación CSV</DialogTitle>
      <DialogContent>
        <FormControl size="small" sx={{ minWidth: 240, mb: 2 }}>
          <InputLabel>Comparar clientes por</InputLabel>
          <Select label="Comparar clientes por" value={importKey} onChange={(e) => onImportKeyChange(e.target.value as CustomerImportKey)}>
            {CUSTOMER_IMPORT_KEY_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {!rows && (
          <Typography variant="body2" color="text.secondary">
            Seleccioná un archivo CSV para ver la vista previa.
          </Typography>
        )}

        {rows && (
          <>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <Chip color="success" label={`${toCreate.length} a crear`} />
              <Chip color="info" label={`${toUpdate.length} a actualizar`} />
              {ambiguous.length > 0 && <Chip color="warning" label={`${ambiguous.length} ambiguos`} />}
            </Stack>

            {ambiguous.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {ambiguous.length} fila{ambiguous.length !== 1 ? "s" : ""} coinciden con 2 o más clientes existentes por el campo elegido — se
                tratarán como alta nueva. Revisá manualmente si corresponde actualizar alguno en particular.
              </Alert>
            )}

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fila</TableCell>
                  <TableCell>Nombre (CSV)</TableCell>
                  <TableCell>Acción</TableCell>
                  <TableCell>Cliente existente</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.rowIndex}>
                    <TableCell>{row.rowIndex}</TableCell>
                    <TableCell>{customerLabel(row.data)}</TableCell>
                    <TableCell>
                      {row.action === "create" && <Chip size="small" color="success" label="Crear" />}
                      {row.action === "update" && <Chip size="small" color="info" label="Actualizar" />}
                      {row.action === "ambiguous" && <Chip size="small" color="warning" label={`Ambiguo (${row.matchCount} matches) → crea`} />}
                    </TableCell>
                    <TableCell>{row.matchedCustomer ? customerLabel(row.matchedCustomer) : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={executing}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={onConfirm} disabled={!rows || rows.length === 0 || executing}>
          {executing ? "Importando…" : `Confirmar importación (${rows?.length ?? 0} filas)`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImportCsvPreviewDialog;
