import React, { useState } from "react";
import { Box, Paper, Typography } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { esES } from "@mui/x-data-grid/locales";
import type { ActivityRow } from "@/services/analytics.service";
import { getPageSizeOptions } from "@/utils/dataGrid.util";
import { formatPercent, formatPoints } from "./analyticsFormat";

interface ActivityTableProps {
  title: string;
  /** Cabecera de la primera columna ("Usuario", "Cliente"). */
  entityLabel: string;
  rows: ActivityRow[];
  loading: boolean;
  emptyText: string;
  testId?: string;
}

const countColumn = (field: keyof ActivityRow, headerName: string, description: string): GridColDef<ActivityRow> => ({
  field,
  headerName,
  description,
  type: "number",
  width: 110,
});

/** Embudo de presupuestos desglosado por usuario o por cliente. */
export const ActivityTable: React.FC<ActivityTableProps> = ({ title, entityLabel, rows, loading, emptyText, testId }) => {
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });

  const columns: GridColDef<ActivityRow>[] = [
    {
      field: "name",
      headerName: entityLabel,
      flex: 1,
      minWidth: 200,
      renderCell: ({ row }) => (
        <Box sx={{ lineHeight: 1.2, py: 0.5 }}>
          <Typography variant="body2" fontWeight="bold">
            {row.name}
          </Typography>
          {row.email && (
            <Typography variant="caption" color="text.secondary">
              {row.email}
            </Typography>
          )}
        </Box>
      ),
    },
    countColumn("quotes", "Presupuestos", "Presupuestos distintos con actividad en el periodo"),
    countColumn("calculated", "Calculados", "Con al menos un cálculo de precio"),
    countColumn("pdfDownloaded", "PDF", "Con el PDF descargado"),
    countColumn("draftSaved", "Guardados", "Guardados como borrador"),
    countColumn("cartAdded", "Carrito", "Añadidos al carrito"),
    countColumn("ordered", "Pedidos", "Convertidos en orden"),
    {
      field: "conversion",
      headerName: "Conversión",
      description: "Pedidos sobre presupuestos",
      type: "number",
      width: 110,
      valueGetter: (_value, row) => (row.quotes > 0 ? row.ordered / row.quotes : 0),
      renderCell: ({ row }) => formatPercent(row.ordered, row.quotes),
    },
    {
      field: "quotedPoints",
      headerName: "Valor presupuestado",
      type: "number",
      width: 160,
      valueFormatter: (value: number) => formatPoints(value),
    },
    {
      field: "orderedPoints",
      headerName: "Valor pedido",
      type: "number",
      width: 140,
      valueFormatter: (value: number) => formatPoints(value),
    },
  ];

  return (
    <Paper sx={{ p: 2, borderRadius: 3 }} data-testid={testId}>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
        {title}
      </Typography>
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id ?? "public"}
        loading={loading}
        localeText={{ ...esES.components.MuiDataGrid.defaultProps.localeText, noRowsLabel: emptyText }}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={getPageSizeOptions(rows.length)}
        initialState={{ sorting: { sortModel: [{ field: "quotes", sort: "desc" }] } }}
        getRowHeight={() => "auto"}
        density="compact"
        disableRowSelectionOnClick
        sx={{ border: 0, minHeight: 200 }}
      />
    </Paper>
  );
};
