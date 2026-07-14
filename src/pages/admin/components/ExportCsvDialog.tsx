// src/pages/admin/components/ExportCsvDialog.tsx
// Modal reutilizable "¿qué exportar?" para el botón Exportar CSV de cualquier listado
// admin (con DataGrid de MUI como Materials/EdgeProfiles, o con lista custom como
// Customers). Ofrece 3 alcances porque la paginación ya es de por sí un filtro
// implícito (siempre hay una página visible distinta del total, haya o no un filtro
// de columna/búsqueda activo). Agnóstico de dónde viene el filtro: el caller calcula
// los 3 conteos y la descripción legible del filtro activo (ver describeGridFilterModel
// para el caso DataGrid, o construir el string a mano para listas custom).
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
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  Checkbox,
  FormGroup,
} from "@mui/material";
import type { GridFilterModel } from "@mui/x-data-grid";

export type ExportCsvScope = "page" | "filtered" | "all";

interface ExportCsvDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (scope: ExportCsvScope, selectedHeaders: string[]) => void;
  pageCount: number;
  filteredCount: number;
  totalCount: number;
  filterDescription: string | null;
  /** Headers disponibles para exportar (orden = orden de columnas del CSV). Si se omite, no se muestra selector y se exportan todas. */
  availableColumns?: string[];
}

/** Helper para callers que usan MUI DataGrid (filtro de columna nativo). */
export const describeGridFilterModel = (filterModel: GridFilterModel): string | null => {
  if (!filterModel.items || filterModel.items.length === 0) return null;
  return filterModel.items
    .filter((item) => item.value !== undefined && item.value !== "")
    .map((item) => `${item.field} ${item.operator} "${item.value}"`)
    .join(filterModel.logicOperator === "or" ? " O " : " Y ");
};

const ExportCsvDialog: React.FC<ExportCsvDialogProps> = ({
  open,
  onClose,
  onConfirm,
  pageCount,
  filteredCount,
  totalCount,
  filterDescription,
  availableColumns,
}) => {
  const [scope, setScope] = React.useState<ExportCsvScope>("filtered");
  const [selectedColumns, setSelectedColumns] = React.useState<string[]>(availableColumns ?? []);

  // Si cambia el set de columnas disponibles (u se abre el modal), reset a "todas seleccionadas" por default.
  React.useEffect(() => {
    if (open && availableColumns) setSelectedColumns(availableColumns);
  }, [open, availableColumns]);

  const toggleColumn = (header: string) => {
    setSelectedColumns((prev) => (prev.includes(header) ? prev.filter((h) => h !== header) : [...prev, header]));
  };

  const allSelected = availableColumns ? selectedColumns.length === availableColumns.length : true;

  const handleConfirm = () => {
    onConfirm(scope, availableColumns ? selectedColumns : []);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      slotProps={{
        paper: {
          sx: { width: "100%", maxWidth: "900px", height: "100vh", maxHeight: "800px" },
        },
      }}
    >
      <DialogTitle>¿Qué datos exportar?</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        {filterDescription && (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Filtro activo:
            </Typography>
            <Chip label={filterDescription} size="small" variant="outlined" />
          </Stack>
        )}
        <RadioGroup value={scope} onChange={(e) => setScope(e.target.value as ExportCsvScope)}>
          <FormControlLabel value="page" control={<Radio />} label={`Página actual (${pageCount} filas)`} />
          <FormControlLabel
            value="filtered"
            control={<Radio />}
            label={filterDescription ? `Resultado filtrado, todas las páginas (${filteredCount} filas)` : `Todas las páginas (${filteredCount} filas)`}
          />
          <FormControlLabel value="all" control={<Radio />} label={`Todo el listado, sin filtros (${totalCount} filas)`} />
        </RadioGroup>

        {availableColumns && availableColumns.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Columnas a exportar ({selectedColumns.length}/{availableColumns.length}):
              </Typography>
              <Button
                size="small"
                onClick={() => setSelectedColumns(allSelected ? [] : availableColumns)}
                sx={{ fontWeight: 700, textTransform: "none" }}
              >
                {allSelected ? "Ninguna" : "Todas"}
              </Button>
            </Stack>
            <FormGroup
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                alignContent: "start",
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                pr: 1,
              }}
            >
              {availableColumns.map((header) => (
                <FormControlLabel
                  key={header}
                  control={<Checkbox size="small" checked={selectedColumns.includes(header)} onChange={() => toggleColumn(header)} />}
                  label={<Typography variant="body2">{header}</Typography>}
                />
              ))}
            </FormGroup>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleConfirm} disabled={availableColumns ? selectedColumns.length === 0 : false}>
          Exportar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportCsvDialog;
