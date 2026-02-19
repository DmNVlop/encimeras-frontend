// src/pages/admin/MaterialsPage.tsx
import React, { useState, useEffect, useRef } from "react";
import { Box, Button, CircularProgress, Chip } from "@mui/material";
import { DataGrid, type GridColDef, GridActionsCellItem, type GridRowId, type GridRowSelectionModel } from "@mui/x-data-grid";
import { esES } from "@mui/x-data-grid/locales";
import { create, get, remove } from "@/services/api.service";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import type { Material, PricingRecipe } from "@/interfases/materials.interfase";
import MaterialEditModal from "./materials/MaterialEditModal";
import AdminPageTitle from "./components/AdminPageTitle";

// =============================================================================
// COMPONENTE PRINCIPAL: MaterialsPage
// =============================================================================

const MaterialsPage: React.FC = () => {
  // --- Estados de la Página Principal ---
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>({ type: "include", ids: new Set<GridRowId>() });
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });

  // --- Estados para controlar el Modal ---
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Partial<Material> | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // =============================================================================
  // SECCIÓN DE LÓGICA DE DATOS
  // =============================================================================

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const data = await get<Material[]>("/materials");
      setMaterials(data.map((m) => ({ ...m, id: m._id })));
    } catch (error) {
      console.error("Error al cargar los materiales:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  // =============================================================================
  // SECCIÓN DE MANEJADORES DE EVENTOS
  // =============================================================================

  const handleOpenModal = (material?: Material) => {
    setIsEditMode(!!material);
    setSelectedMaterial(material || null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedMaterial(null);
  };

  // Esta función es llamada por el Modal cuando termina de guardar
  const handleSave = () => {
    handleCloseModal();
    loadMaterials(); // Recargamos los datos para ver los cambios
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este material?")) {
      await remove("/materials", [id]);
      loadMaterials();
    }
  };

  const handleDeleteSelected = async () => {
    const idsToDelete = Array.from(selectionModel.ids);
    if (window.confirm(`¿Estás seguro de que quieres eliminar los ${idsToDelete.length} materiales seleccionados?`)) {
      await remove("/materials", idsToDelete as string[]);
      loadMaterials();
      setSelectionModel({ type: "include", ids: new Set<GridRowId>() });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter((line) => line.trim());
      const headerLine = lines.shift();
      if (!headerLine) return alert("El archivo CSV está vacío o no tiene cabecera.");

      const headers = headerLine.trim().split(";");
      const materialsToCreate = [];

      for (const line of lines) {
        const values = line.trim().split(";");
        const materialData: any = {};
        headers.forEach((header, index) => {
          const value = values[index]?.trim();
          if (["thicknesses", "finishes", "faces", "groups"].includes(header)) {
            materialData[header] = value
              ? value
                  .split(",")
                  .map((s) => s.trim())
                  .filter((s) => s)
              : [];
          } else if (header === "pricePerSquareMeter") {
            // Ignoramos el precio
          } else if (header === "isActive") {
            materialData[header] = value ? value.toLowerCase() === "true" : false;
          } else if (value) {
            materialData[header] = value;
          }
        });
        materialsToCreate.push(create("/materials", materialData));
      }

      try {
        await Promise.all(materialsToCreate);
        alert(`${materialsToCreate.length} materiales importados con éxito.`);
        loadMaterials();
      } catch (error) {
        alert("Hubo un error al importar. Revisa la consola.");
        console.error("Error en la importación:", error);
      }
    };
    reader.readAsText(file);
    if (event.target) event.target.value = ""; // Reset input
  };

  // =============================================================================
  // SECCIÓN DE DEFINICIÓN DE COLUMNAS
  // =============================================================================

  const columns: GridColDef<Material>[] = [
    { field: "ref", headerName: "Referencia", width: 100 },
    { field: "name", headerName: "Nombre", width: 280 },
    // {
    //   field: "validCombinationsCount",
    //   headerName: "Combinaciones",
    //   type: "number",
    //   width: 130,
    //   align: "center",
    //   headerAlign: "center",
    //   renderCell: (params) => <Chip label={params?.value || 0} color={params.value > 0 ? "success" : "default"} size="small" variant="outlined" />,
    // },
    { field: "category", headerName: "Categoría", width: 110 },
    { field: "type", headerName: "Tipo", width: 110 },
    {
      field: "pricingRecipes",
      headerName: "Recetas de Precio",
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        // Nueva lógica de renderizado
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, alignItems: "center", height: "100%" }}>
          {/* Casteamos a 'PricingRecipe[]' (de nuestra interfaz) */}
          {((params.value as PricingRecipe[]) || []).map((recipe) => (
            <Chip
              key={recipe.productType}
              // 2. Mostramos el productType como etiqueta
              label={recipe.productType}
              size="small"
              color="primary"
              variant="outlined"
              // 3. (Opcional) Añadimos un tooltip que muestra los atributos
              title={`Atributos: ${recipe.pricingAttributes.join(", ")} | Unidad: ${recipe.unit}`}
            />
          ))}
        </Box>
      ),
    },
    {
      field: "selectableAttributes",
      headerName: "Atributos (Wizard)",
      width: 200,
      renderCell: (params) => (
        // Reutilizamos la lógica de 'Chip' para mostrar el array de strings
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, alignItems: "center", height: "100%" }}>
          {((params.value as string[]) || []).map((attr) => (
            <Chip
              key={attr}
              label={attr.replace("MAT_", "")} // Limpiamos el prefijo
              size="small"
            />
          ))}
        </Box>
      ),
    },
    { field: "isActive", headerName: "Activo", type: "boolean", width: 80 },
    {
      field: "actions",
      type: "actions",
      headerName: "Acciones",
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem icon={<EditIcon />} label="Editar" onClick={() => handleOpenModal(params.row)} />,
        <GridActionsCellItem icon={<DeleteIcon />} label="Eliminar" onClick={() => handleDelete(params.id as string)} />,
      ],
    },
  ];

  // =============================================================================
  // SECCIÓN DE RENDERIZADO (JSX)
  // =============================================================================

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <AdminPageTitle>Gestión de Materiales</AdminPageTitle>
        <Box>
          <input type="file" accept=".csv" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileUpload} />
          <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => fileInputRef.current?.click()} sx={{ mr: 1 }}>
            Importar CSV
          </Button>
          {selectionModel.ids.size > 0 && (
            <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={handleDeleteSelected} sx={{ mr: 1 }}>
              Borrar ({selectionModel.ids.size})
            </Button>
          )}
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>
            Añadir Material
          </Button>
        </Box>
      </Box>
      <Box sx={{ height: "calc(100vh - 180px)", width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
        {loading ? (
          <CircularProgress />
        ) : (
          <DataGrid
            rows={materials}
            columns={columns}
            getRowId={(row) => row._id}
            localeText={esES.components.MuiDataGrid.defaultProps.localeText}
            checkboxSelection
            onRowSelectionModelChange={(newModel) => setSelectionModel(newModel)}
            rowSelectionModel={selectionModel}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 25, 50]}
            rowHeight={60}
          />
        )}
      </Box>

      {/* --- Renderizamos el nuevo componente Modal --- */}
      {modalOpen && <MaterialEditModal open={modalOpen} onClose={handleCloseModal} material={selectedMaterial} isEditMode={isEditMode} onSave={handleSave} />}
    </Box>
  );
};

export default MaterialsPage;
