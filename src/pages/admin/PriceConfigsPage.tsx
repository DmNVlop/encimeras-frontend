// src/pages/admin/PriceConfigsPage.tsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Modal,
  TextField,
  IconButton,
  Chip,
  Collapse, // Importado para el asistente
  Autocomplete,
  CircularProgress,
} from "@mui/material";
import { DataGrid, type GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import { esES } from "@mui/x-data-grid/locales";
import { get, create, update, remove } from "@/services/apiService";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import BuildIcon from "@mui/icons-material/Build"; // Icono para el asistente

// --- Importar el nuevo componente ---
import { KeyBuilderAssistant } from "./price-configs/KeyBuilderAssistant";

// --- Interfaces (Asegúrate de que coincidan con tus archivos) ---
import type { AttributeToConfigPrice } from "@/interfases/attribute.interfase";

// Interfaz para la fila de la DataGrid (debe coincidir con la DB)
interface PriceConfig {
  _id: string;
  productType: string;
  combinationKey: string;
  price: number; // Coincide con el DUPLEX
}

// Estilo del Modal (sin cambios)
const modalStyle = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "100%", sm: "90vw" },
  maxWidth: 600,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  maxHeight: "90vh",
  overflowY: "auto",
  borderRadius: { xs: 0, sm: 1 },
};

// =============================================================================
// COMPONENTE PriceConfigsPage
// =============================================================================
const PriceConfigsPage: React.FC = () => {
  // --- ESTADO PRINCIPAL ---
  const [priceConfigs, setPriceConfigs] = useState<PriceConfig[]>([]);
  const [open, setOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [modalTitle, setModalTitle] = useState("Nueva Configuración de Precio");

  // --- ESTADO DEL FORMULARIO (Refactorizado para DTO) ---
  const [currentConfigId, setCurrentConfigId] = useState<string | null>(null);
  const [currentProductType, setCurrentProductType] = useState("");
  const [currentCombinationKey, setCurrentCombinationKey] = useState("");
  const [currentPrice, setCurrentPrice] = useState<number>(0);

  // --- ESTADO DEL ASISTENTE ---
  const [isKeyBuilderOpen, setIsKeyBuilderOpen] = useState(false);
  const [allAttributeTypes, setAllAttributeTypes] = useState<string[]>([]);
  const [attributeValuesCache, setAttributeValuesCache] = useState<Record<string, AttributeToConfigPrice[]>>({});

  // --- ESTADO para la lista de Product Types ---
  const [productTypesList, setProductTypesList] = useState<string[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);

  // --- CARGA DE DATOS ---
  const loadPriceConfigs = async () => {
    const data = await get<PriceConfig>("/price-configs");
    setPriceConfigs(data);
  };

  const loadAllAttributeTypes = async () => {
    const allAttrs = await get<AttributeToConfigPrice>("/attributes");
    const uniqueTypes = Array.from(new Set(allAttrs.map((attr) => attr.type)));
    setAllAttributeTypes(uniqueTypes);
  };

  const loadAttributeValues = async (type: string) => {
    if (type && !attributeValuesCache[type]) {
      const values = await get<AttributeToConfigPrice>("/attributes", { params: { type } });
      setAttributeValuesCache((prev) => ({ ...prev, [type]: values }));
    }
  };

  useEffect(() => {
    loadPriceConfigs();
    loadAllAttributeTypes(); // Cargar tipos para el asistente
    loadAllProductTypes();
  }, []);

  // --- NUEVA FUNCIÓN para cargar los product types ---
  const loadAllProductTypes = async () => {
    try {
      setIsLoadingTypes(true);
      // Asumimos que el endpoint es /product-types
      const types = await get<string>("/dictionaries/product-types");
      setProductTypesList(types);
    } catch (error) {
      console.error("Error cargando el diccionario de product types:", error);
    } finally {
      setIsLoadingTypes(false);
    }
  };

  // --- MANEJO DEL MODAL (Refactorizado) ---
  const handleOpen = (config?: PriceConfig, mode: "create" | "edit" | "duplicate" = "create") => {
    if (mode === "edit" && config) {
      setIsEditMode(true);
      setModalTitle("Editar Precio de Configuración");
      setCurrentConfigId(config._id);
      setCurrentProductType(config.productType);
      setCurrentCombinationKey(config.combinationKey);
      setCurrentPrice(config.price);
    } else if (mode === "duplicate" && config) {
      setIsEditMode(false); // Estamos creando
      setModalTitle("Duplicar Configuración");
      setCurrentConfigId(null);
      setCurrentProductType(config.productType);
      setCurrentCombinationKey(config.combinationKey);
      setCurrentPrice(config.price); // Precio inicial para duplicar
    } else {
      // create
      setIsEditMode(false);
      setModalTitle("Nueva Configuración de Precio");
      setCurrentConfigId(null);
      setCurrentProductType("");
      setCurrentCombinationKey("");
      setCurrentPrice(0);
    }
    setIsKeyBuilderOpen(false); // El asistente siempre empieza cerrado
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  // --- ACCIONES CRUD (Sin cambios) ---
  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta configuración?")) {
      await remove("/price-configs", [id]);
      loadPriceConfigs();
    }
  };

  // --- SUBMIT DEL FORMULARIO (Refactorizado para DTO) ---
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      productType: currentProductType,
      combinationKey: currentCombinationKey,
      price: currentPrice,
    };

    try {
      if (isEditMode && currentConfigId) {
        // En modo edición, solo actualizamos el precio
        await update("/price-configs", currentConfigId, { price: currentPrice });
      } else {
        // En modo creación, enviamos el payload DTO
        await create("/price-configs", payload);
      }
      loadPriceConfigs();
      handleClose();
    } catch (error) {
      console.error("Error al guardar la configuración:", error);
      // Aquí podrías mostrar un snackbar/alerta al usuario
      alert("Error al guardar. Revisa la consola.");
    }
  };

  // --- COLUMNAS DEL DataGrid (Refactorizado) ---
  const columns: GridColDef<PriceConfig>[] = [
    {
      field: "productType",
      headerName: "Product Type",
      flex: 1,
      minWidth: 150,
      renderCell: (params) => <Chip label={params.value} color="primary" variant="outlined" size="small" />,
    },
    {
      field: "combinationKey",
      headerName: "Combination Key",
      flex: 2,
      minWidth: 300,
      renderCell: (params) => {
        const keyString = params.value as string;
        if (keyString === "DEFAULT") {
          return <Chip label="DEFAULT" color="secondary" variant="outlined" size="small" />;
        }
        const pairs = keyString.split("||");
        return (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, py: 1 }}>
            {pairs.map((pair, index) => {
              const [key, value] = pair.split(":");
              if (!key || value === undefined) return null;
              return <Chip key={`${key}-${index}`} label={`${key.replace("MAT_", "").toLowerCase()}: ${value}`} size="small" />;
            })}
          </Box>
        );
      },
    },
    { field: "price", headerName: "Precio (Puntos)", type: "number", width: 150 },
    {
      field: "actions",
      type: "actions",
      headerName: "Acciones",
      width: 150,
      getActions: (params) => [
        <GridActionsCellItem icon={<ContentCopyIcon />} label="Duplicar" onClick={() => handleOpen(params.row, "duplicate")} />,
        <GridActionsCellItem icon={<EditIcon />} label="Editar" onClick={() => handleOpen(params.row, "edit")} />,
        <GridActionsCellItem icon={<DeleteIcon />} label="Eliminar" onClick={() => handleDelete(params.id as string)} />,
      ],
    },
  ];

  // --- RENDERIZADO PRINCIPAL ---
  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h4">Configuración de Precios</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen(undefined, "create")}>
          Añadir Configuración
        </Button>
      </Box>
      <Box sx={{ height: "70vh", width: "100%" }}>
        <DataGrid
          rows={priceConfigs}
          columns={columns}
          getRowId={(row) => row._id}
          localeText={esES.components.MuiDataGrid.defaultProps.localeText}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50]}
          rowHeight={60} // Aumentado ligeramente para los chips
        />
      </Box>

      {/* --- MODAL REFACTORIZADO --- */}
      <Modal open={open} onClose={handleClose}>
        <Box sx={modalStyle} component="form" onSubmit={handleSubmit}>
          <IconButton aria-label="close" onClick={handleClose} sx={{ position: "absolute", right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}>
            <CloseIcon />
          </IconButton>

          <Typography variant="h6" component="h2">
            {modalTitle}
          </Typography>

          <Autocomplete
            freeSolo // <-- Permite escribir valores que no están en la lista
            options={productTypesList} // <-- La lista de la BBDD
            loading={isLoadingTypes} // <-- Muestra spinner mientras carga
            value={currentProductType}
            disabled={isEditMode}
            onInputChange={(_event, newValue) => {
              // Maneja tanto la selección como la escritura
              if (!isEditMode) {
                setCurrentProductType(newValue);
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                margin="normal"
                required
                fullWidth
                name="productType"
                label="Product Type"
                helperText={isEditMode ? "No se puede cambiar en modo edición." : "Seleccione o escriba un Product Type"}
                // InputProps={{
                //   ...params.InputProps,
                //   endAdornment: (
                //     <>
                //       {isLoadingTypes ? <CircularProgress color="inherit" size={20} /> : null}
                //       {params.InputProps.endAdornment}
                //     </>
                //   ),
                // }}
                slotProps={{
                  input: {
                    ...params.InputProps, // Mantenemos la funcionalidad del Autocomplete
                    endAdornment: (
                      <>
                        {isLoadingTypes ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  },
                }}
              />
            )}
          />

          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mt: 2 }}>
            <TextField
              required
              fullWidth
              name="combinationKey"
              label="Combination Key"
              value={currentCombinationKey}
              onChange={(e) => setCurrentCombinationKey(e.target.value)}
              disabled={isEditMode}
              helperText={isEditMode ? "No se puede cambiar en modo edición." : "Escriba 'DEFAULT' o use el asistente."}
            />
            <Button variant="outlined" onClick={() => setIsKeyBuilderOpen(!isKeyBuilderOpen)} disabled={isEditMode} sx={{ mt: 1, p: "14px" }}>
              <BuildIcon />
            </Button>
          </Box>

          {/* --- AQUÍ SE INSERTA EL ASISTENTE (COLAPSABLE) --- */}
          <Collapse in={isKeyBuilderOpen && !isEditMode}>
            <KeyBuilderAssistant
              allAttributeTypes={allAttributeTypes}
              attributeValuesCache={attributeValuesCache}
              loadAttributeValues={loadAttributeValues}
              onConfirmKey={(key) => {
                setCurrentCombinationKey(key); // ¡Pega la clave generada!
                setIsKeyBuilderOpen(false); // Cierra el asistente
              }}
            />
          </Collapse>

          <TextField
            margin="normal"
            required
            fullWidth
            name="price"
            label="Precio (Puntos)"
            type="number"
            value={currentPrice || ""}
            onChange={(e) => setCurrentPrice(Number(e.target.value))}
            sx={{ mt: 2 }}
          />

          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3 }}>
            Guardar
          </Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default PriceConfigsPage;
