// src/pages/admin/MaterialsPage.tsx
import React, { useState, useEffect, useRef } from "react";
import { Box, Button, CircularProgress, Chip, Tooltip, IconButton, Typography } from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  GridActionsCellItem,
  type GridRowId,
  type GridRowSelectionModel,
  type GridFilterModel,
  useGridApiRef,
  gridFilteredSortedRowIdsSelector,
} from "@mui/x-data-grid";
import { esES } from "@mui/x-data-grid/locales";
import { create, get, remove } from "@/services/api.service";
import type { ValidCombination } from "./materials/CombinacionesValidasTab";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import type { Material, PricingRecipe } from "@/interfases/materials.interfase";
import MaterialEditModal from "./materials/MaterialEditModal";
import AdminPageTitle from "./components/AdminPageTitle";
import ExportCsvDialog, { type ExportCsvScope, describeGridFilterModel } from "./components/ExportCsvDialog";
import CsvHelpButton from "./components/CsvHelpButton";
import { parseCsv, buildCsv, downloadCsv, arrayToCsvField, csvFieldToArray, boolToCsvField, csvFieldToBool } from "@/utils/csv.util";
import { getPageSizeOptions } from "@/utils/dataGrid.util";

// =============================================================================
// MAPEO DE COLUMNAS CSV — mismo objeto usado para import y export (Tarea 2.1/2.2)
// =============================================================================

const MATERIAL_CSV_COLUMNS: {
  header: string;
  get: (m: Material) => string;
  set: (row: any, v: string) => void;
}[] = [
  { header: "ref", get: (m) => m.ref ?? "", set: (row, v) => (row.ref = v) },
  { header: "name", get: (m) => m.name ?? "", set: (row, v) => (row.name = v) },
  { header: "description", get: (m) => m.description ?? "", set: (row, v) => (row.description = v) },
  { header: "category", get: (m) => m.category ?? "", set: (row, v) => (row.category = v) },
  { header: "type", get: (m) => m.type ?? "", set: (row, v) => (row.type = v) },
  { header: "isActive", get: (m) => boolToCsvField(m.isActive), set: (row, v) => (row.isActive = csvFieldToBool(v)) },
  {
    header: "selectableAttributes",
    get: (m) => arrayToCsvField(m.selectableAttributes),
    set: (row, v) => (row.selectableAttributes = csvFieldToArray(v)),
  },
  {
    header: "pricingRecipes",
    get: (m) => JSON.stringify(m.pricingRecipes ?? []),
    set: (row, v) => (row.pricingRecipes = v ? JSON.parse(v) : []),
  },
];

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
  const [combosToClone, setCombosToClone] = useState<ValidCombination[]>([]);
  const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [] });
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const apiRef = useGridApiRef();

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
    setCombosToClone([]);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedMaterial(null);
    setCombosToClone([]);
  };

  const handleDuplicate = async (material: Material) => {
    const { _id, validCombinationsCount, ...rest } = material;
    setIsEditMode(false);
    setSelectedMaterial({ ...rest, name: `${material.name} (copia)`, ref: "" });
    try {
      const combos = await get<ValidCombination[]>("/valid-combinations", { params: { materialId: material._id } });
      setCombosToClone(combos);
    } catch (error) {
      console.error("Error al cargar combinaciones para duplicar:", error);
      setCombosToClone([]);
    }
    setModalOpen(true);
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
      const rows = parseCsv(text, ";");
      const headerRow = rows.shift();
      if (!headerRow) return alert("El archivo CSV está vacío o no tiene cabecera.");

      const missingHeaders = MATERIAL_CSV_COLUMNS.filter((col) => !headerRow.includes(col.header));
      if (missingHeaders.length > 0) {
        return alert(`Faltan columnas requeridas en el CSV: ${missingHeaders.map((c) => c.header).join(", ")}`);
      }

      const materialsToCreate = [];
      for (const values of rows) {
        const materialData: any = {};
        MATERIAL_CSV_COLUMNS.forEach((col) => {
          const index = headerRow.indexOf(col.header);
          col.set(materialData, values[index] ?? "");
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

  const exportMaterials = (materialsToExport: Material[]) => {
    const headers = MATERIAL_CSV_COLUMNS.map((col) => col.header);
    const rows = materialsToExport.map((m) => {
      const row: Record<string, string> = {};
      MATERIAL_CSV_COLUMNS.forEach((col) => (row[col.header] = col.get(m)));
      return row;
    });
    downloadCsv("materials.csv", buildCsv(headers, rows));
  };

  const handleConfirmExport = (scope: ExportCsvScope) => {
    if (scope === "all") {
      exportMaterials(materials);
      return;
    }

    const filteredIds = gridFilteredSortedRowIdsSelector(apiRef);
    const filteredMaterials = filteredIds.map((id) => materials.find((m) => m._id === id)).filter((m): m is Material => !!m);

    if (scope === "filtered") {
      exportMaterials(filteredMaterials);
      return;
    }

    // scope === "page": recorta a la página actual sobre el resultado ya filtrado
    const { page, pageSize } = paginationModel;
    exportMaterials(filteredMaterials.slice(page * pageSize, page * pageSize + pageSize));
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
      width: 130,
      getActions: (params) => [
        <GridActionsCellItem icon={<EditIcon />} label="Editar" onClick={() => handleOpenModal(params.row)} />,
        <GridActionsCellItem icon={<ContentCopyIcon />} label="Duplicar" onClick={() => handleDuplicate(params.row)} />,
        <GridActionsCellItem icon={<DeleteIcon />} label="Eliminar" onClick={() => handleDelete(params.id as string)} />,
      ],
    },
  ];

  // =============================================================================
  // SECCIÓN DE RENDERIZADO (JSX)
  // =============================================================================

  const filteredCount = apiRef.current ? gridFilteredSortedRowIdsSelector(apiRef).length : materials.length;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <AdminPageTitle>Gestión de Materiales</AdminPageTitle>
        <Box>
          <input type="file" accept=".csv" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileUpload} />
          <Tooltip title="Importar materiales desde CSV">
            <IconButton onClick={() => fileInputRef.current?.click()} sx={{ mr: 0.5 }}>
              <UploadFileIcon />
            </IconButton>
          </Tooltip>
          <CsvHelpButton title="Importar / Exportar Materiales">
            <Typography variant="body2">
              <strong>Exportar</strong> descarga un CSV de los materiales visibles (página, filtrado o todo) con todas las columnas: referencia,
              nombre, descripción, categoría, tipo, activo, atributos seleccionables del wizard y recetas de precio.
            </Typography>
            <Typography variant="body2">
              <strong>Importar</strong> lee un CSV separado por <code>;</code> con las columnas <code>ref, name, description, category, type,
              isActive, selectableAttributes, pricingRecipes</code>. Todas son requeridas en el header (aunque el valor pueda ir vacío).
            </Typography>
            <Typography variant="body2">
              <strong>selectableAttributes</strong> es una lista separada por comas dentro de la misma celda, ej:{" "}
              <code>MAT_COLOR,MAT_ACABADO</code>.
            </Typography>
            <Typography variant="body2">
              <strong>pricingRecipes</strong> es un array JSON completo dentro de la celda (con las comillas internas duplicadas según el
              estándar CSV), ej: <code>[&#123;&quot;productType&quot;:&quot;ENCIMERA&quot;,&quot;unit&quot;:&quot;m2&quot;,&quot;pricingAttributes&quot;:[]&#125;]</code>
              . Es más fácil exportar un material existente, editar esa celda en un editor de texto/Excel y reimportar, que escribirlo desde
              cero.
            </Typography>
            <Typography variant="body2">
              Cada fila del CSV crea un material nuevo — el import no actualiza materiales existentes por referencia.
            </Typography>
          </CsvHelpButton>
          <Tooltip title="Exportar materiales a CSV">
            <IconButton onClick={() => setExportDialogOpen(true)} sx={{ mr: 0.5 }}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
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
            apiRef={apiRef}
            rows={materials}
            columns={columns}
            getRowId={(row) => row._id}
            localeText={esES.components.MuiDataGrid.defaultProps.localeText}
            checkboxSelection
            onRowSelectionModelChange={(newModel) => setSelectionModel(newModel)}
            rowSelectionModel={selectionModel}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            filterModel={filterModel}
            onFilterModelChange={setFilterModel}
            pageSizeOptions={getPageSizeOptions(materials.length)}
            rowHeight={60}
          />
        )}
      </Box>

      {/* --- Renderizamos el nuevo componente Modal --- */}
      {modalOpen && (
        <MaterialEditModal
          open={modalOpen}
          onClose={handleCloseModal}
          material={selectedMaterial}
          isEditMode={isEditMode}
          onSave={handleSave}
          combosToClone={combosToClone}
        />
      )}

      <ExportCsvDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        onConfirm={handleConfirmExport}
        pageCount={Math.max(0, Math.min(paginationModel.pageSize, filteredCount - paginationModel.page * paginationModel.pageSize))}
        filteredCount={filteredCount}
        totalCount={materials.length}
        filterDescription={describeGridFilterModel(filterModel)}
      />
    </Box>
  );
};

export default MaterialsPage;
