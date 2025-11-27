// src/pages/admin/AddonsPage.tsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper, // DataGrid se ve mejor dentro de un Paper
} from "@mui/material";
import { DataGrid, type GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import { esES } from "@mui/x-data-grid/locales"; // Para traducir la grilla
import { get, remove } from "../../services/apiService"; // Nuestros servicios API
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

// Importamos nuestra nueva interfaz
import type { Addon } from "../../interfases/addon.interfase";
import AddonEditModal from "./addons/AddonEditModal";

// =============================================================================
// COMPONENTE PRINCIPAL: AddonsPage
// =============================================================================

const AddonsPage: React.FC = () => {
  // --- Estados de la Página (clonado de MaterialsPage) ---
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  // --- Estados para controlar el Modal (para Fase 2) ---
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAddon, setSelectedAddon] = useState<Partial<Addon> | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // =============================================================================
  // SECCIÓN DE LÓGICA DE DATOS
  // =============================================================================

  // --- useEffect para cargar los datos ---
  const loadAddons = async () => {
    setLoading(true);
    try {
      const data = await get<Addon>("/addons");
      // Mapeamos _id a id para que DataGrid sea feliz
      setAddons(data.map((a) => ({ ...a, id: a._id })));
    } catch (error) {
      console.error("Error al cargar los Complementos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddons();
  }, []); // Carga solo al montar el componente

  // =============================================================================
  // SECCIÓN DE MANEJADORES DE EVENTOS
  // =============================================================================

  // --- Handlers para el Modal y Eliminación ---
  const handleOpenModal = (addon?: Addon) => {
    setIsEditMode(!!addon);
    setSelectedAddon(addon || null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedAddon(null);
  };

  // Esta función es llamada por el Modal (en Fase 2) cuando termina de guardar
  const handleSave = () => {
    handleCloseModal();
    loadAddons(); // Recargamos los datos para ver los cambios
  };

  // El "Delete" (Eliminar) del CRUD
  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este addon?")) {
      try {
        await remove("/addons", [id]);
        loadAddons(); // Recarga la grilla
      } catch (error) {
        console.error("Error al eliminar el addon:", error);
        alert("Error al eliminar el addon.");
      }
    }
  };

  // =============================================================================
  // SECCIÓN DE DEFINICIÓN DE COLUMNAS
  // =============================================================================

  // --- Columnas para el DataGrid (basadas en tu solicitud) ---
  const columns: GridColDef<Addon>[] = [
    {
      field: "code",
      headerName: "Código (ID)",
      width: 200,
      description: "El identificador único (ej. CLADDING)",
    },
    {
      field: "name",
      headerName: "Nombre",
      flex: 1,
      minWidth: 250,
      description: "El nombre descriptivo (ej. Aplacado)",
    },
    {
      field: "category",
      headerName: "Categoría Visual",
      width: 150,
      renderCell: (params) => (
        // Un pequeño Chip para que se vea bonito
        <span
          style={{
            padding: "4px 8px",
            borderRadius: "4px",
            backgroundColor: params.value === "TRABAJO" ? "#e3f2fd" : params.value === "COMPLEMENTO" ? "#e8f5e9" : "#f3f3f3",
            color: "#333",
            fontWeight: "bold",
            fontSize: "0.85rem",
          }}
        >
          {params.value}
        </span>
      ),
    },
    {
      field: "pricingType",
      headerName: "Tipo de Precio",
      width: 200,
      description: "El 'cerebro' que define cómo calcula el precio",
    },
    {
      field: "productTypeMap",
      headerName: "Enlace (productType)",
      width: 250,
      description: "El 'enlace' a price-configs o materials",
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Acciones",
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem icon={<EditIcon />} label="Editar" onClick={() => handleOpenModal(params.row)} />,
        <GridActionsCellItem icon={<DeleteIcon />} label="Eliminar" onClick={() => handleDelete(params.id as string)} color="error" />,
      ],
    },
  ];

  // =============================================================================
  // SECCIÓN DE RENDERIZADO (JSX)
  // =============================================================================

  // --- El Layout de la Página ---
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
        <Typography variant="h4">Gestión de Complementos</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>
          Añadir Complemento
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
            rows={addons}
            columns={columns}
            getRowId={(row) => row._id} // Usa _id como ID de fila
            localeText={esES.components.MuiDataGrid.defaultProps.localeText}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
          />
        )}
      </Paper>

      {/* --- Placeholder para el Modal (Fase 2) --- */}

      {modalOpen && <AddonEditModal open={modalOpen} onClose={handleCloseModal} onSave={handleSave} addon={selectedAddon} isEditMode={isEditMode} />}
    </Box>
  );
};

export default AddonsPage;
