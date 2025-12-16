// src/pages/admin/MeasurementRuleSetPage.tsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
  Chip, // Para la columna 'ranges'
} from "@mui/material";
import { DataGrid, type GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import { esES } from "@mui/x-data-grid/locales";
import { get, remove } from "@/services/apiService";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

// 1. Importamos nuestra nueva interfaz
import type { MeasurementRuleSet, MeasurementRange } from "@/interfases/measurement-rule-set.interfase";
import MeasurementRuleSetEditModal from "./measurement-rule-sets/MeasurementRuleSetEditModal";

// =============================================================================
// COMPONENTE PRINCIPAL: MeasurementRuleSetPage
// =============================================================================

const MeasurementRuleSetPage: React.FC = () => {
  // --- 2. Estados de la Página ---
  const [ruleSets, setRuleSets] = useState<MeasurementRuleSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  // --- Estados para controlar el Modal (para Fase 2) ---
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRuleSet, setSelectedRuleSet] = useState<Partial<MeasurementRuleSet> | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // =============================================================================
  // SECCIÓN DE LÓGICA DE DATOS
  // =============================================================================

  // --- 3. useEffect para cargar los datos (GET /measurement-rule-sets) ---
  const loadRuleSets = async () => {
    setLoading(true);
    try {
      // Llama al endpoint 'findAll' del controlador
      const data = await get<MeasurementRuleSet>("/measurement-rule-sets");
      setRuleSets(data.map((rs) => ({ ...rs, id: rs._id })));
    } catch (error) {
      console.error("Error al cargar los sets de reglas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRuleSets();
  }, []); // Carga solo al montar el componente

  // =============================================================================
  // SECCIÓN DE MANEJADORES DE EVENTOS
  // =============================================================================

  // --- 4. Handlers para el Modal y Eliminación ---
  const handleOpenModal = (ruleSet?: MeasurementRuleSet) => {
    setIsEditMode(!!ruleSet);
    setSelectedRuleSet(ruleSet || null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedRuleSet(null);
  };

  // Esta función es llamada por el Modal (en Fase 2) cuando termina de guardar
  const handleSave = () => {
    handleCloseModal();
    loadRuleSets(); // Recargamos los datos para ver los cambios
  };

  // El "Delete" (Eliminar) del CRUD
  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este set de reglas?")) {
      try {
        // Llama al endpoint 'remove' del controlador
        await remove("/measurement-rule-sets", [id]);
        loadRuleSets(); // Recarga la grilla
      } catch (error) {
        console.error("Error al eliminar el set de reglas:", error);
        alert("Error al eliminar el set de reglas.");
      }
    }
  };

  // =============================================================================
  // SECCIÓN DE DEFINICIÓN DE COLUMNAS
  // =============================================================================

  // --- 5. Columnas para el DataGrid ---
  const columns: GridColDef<MeasurementRuleSet>[] = [
    {
      field: "name",
      headerName: "Nombre del Set de Reglas",
      flex: 1,
      minWidth: 250,
      description: "El nombre descriptivo (ej. Regla Copete HPL)",
    },
    {
      field: "unit",
      headerName: "Unidad",
      width: 100,
      description: "La unidad de medida de los rangos (ej. mm)",
      align: "center",
      headerAlign: "center",
    },
    {
      field: "ranges",
      headerName: "Rangos Definidos",
      flex: 2,
      minWidth: 300,
      description: "Los rangos de medida definidos en este set",
      // Usamos renderCell para mostrar los 'labels' como Chips
      renderCell: (params) => (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, py: 1, alignItems: "center", height: "100%" }}>
          {((params.value as MeasurementRange[]) || []).map((range) => (
            <Chip
              key={range.label}
              label={range.label}
              size="small"
              title={`Min: ${range.min}, Max: ${range.max}, Tipo: ${range.priceType}`}
              variant="outlined"
            />
          ))}
        </Box>
      ),
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Acciones",
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem icon={<EditIcon />} label="Editar" onClick={() => handleOpenModal(params.row)} />,
        <GridActionsCellItem icon={<DeleteIcon color="error" />} label="Eliminar" onClick={() => handleDelete(params.id as string)} />,
      ],
    },
  ];

  // =============================================================================
  // SECCIÓN DE RENDERIZADO (JSX)
  // =============================================================================

  // --- 6. El Layout de la Página ---
  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h4">Gestión de Reglas de Medición</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>
          Añadir Set de Reglas
        </Button>
      </Box>

      <Paper sx={{ height: 600, width: "100%" }}>
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={ruleSets}
            columns={columns}
            getRowId={(row) => row._id} // Usa _id como ID de fila
            localeText={esES.components.MuiDataGrid.defaultProps.localeText}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            rowHeight={60} // Aumentamos la altura para los Chips
          />
        )}
      </Paper>

      {/* --- 7. Placeholder para el Modal (Fase 2) --- */}

      {modalOpen && (
        <MeasurementRuleSetEditModal open={modalOpen} onClose={handleCloseModal} onSave={handleSave} ruleSet={selectedRuleSet} isEditMode={isEditMode} />
      )}
    </Box>
  );
};

export default MeasurementRuleSetPage;
