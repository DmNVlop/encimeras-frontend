// src/pages/admin/PriceConfigsPage.tsx
import React, { useState, useEffect } from "react";
import { Box, Typography, Button, Modal, TextField, FormControl, InputLabel, Select, MenuItem, IconButton } from "@mui/material";
import { DataGrid, type GridColDef, GridActionsCellItem, GridCloseIcon } from "@mui/x-data-grid";
import { esES } from "@mui/x-data-grid/locales";
import { get, create, update, remove } from "../../services/apiService";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import type { PriceConfig, PriceRuleAttribute } from "../../interfases/price.interfase";
import type { AttributeToConfigPrice } from "../../interfases/attribute.interfase";
import { RemoveCircleOutlineIcon } from "@mui/icons-material/RemoveCircleOutline";

// --- Estilo del Modal Responsivo ---
const modalStyle = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "100%", sm: "90vw" }, // Ancho responsivo
  maxWidth: 600, // Ancho máximo en escritorio
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  maxHeight: "90vh",
  overflowY: "auto",
  borderRadius: { xs: 0, sm: 1 }, // Bordes en escritorio, sin bordes en móvil
};

const PriceConfigsPage: React.FC = () => {
  const [priceConfigs, setPriceConfigs] = useState<PriceConfig[]>([]);
  const [open, setOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });

  const [currentAttributes, setCurrentAttributes] = useState<PriceRuleAttribute[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [currentConfigId, setCurrentConfigId] = useState<string | null>(null);

  const [allAttributeTypes, setAllAttributeTypes] = useState<string[]>([]);
  const [attributeValuesCache, setAttributeValuesCache] = useState<Record<string, AttributeToConfigPrice[]>>({});

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
    if (!attributeValuesCache[type]) {
      const values = await get<AttributeToConfigPrice>("/attributes", { params: { type } });
      setAttributeValuesCache((prev) => ({ ...prev, [type]: values }));
    }
  };

  useEffect(() => {
    loadPriceConfigs();
    loadAllAttributeTypes();
  }, []);

  const handleOpen = (config?: PriceConfig) => {
    if (config) {
      setIsEditMode(true);
      setCurrentConfigId(config._id);
      const attributes = config.combinationKey.split("_").map((pair) => {
        const [type, value] = pair.split(":");
        return { type, value };
      });
      setCurrentAttributes(attributes);
      setCurrentPrice(config.pricePerSquareMeter);
    } else {
      setIsEditMode(false);
      setCurrentConfigId(null);
      setCurrentAttributes([{ type: "", value: "" }]);
      setCurrentPrice(0);
    }
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta configuración?")) {
      await remove("/price-configs", [id]);
      loadPriceConfigs();
    }
  };

  const handleAddAttributeRow = () => {
    setCurrentAttributes((prev) => [...prev, { type: "", value: "" }]);
  };

  const handleRemoveAttributeRow = (index: number) => {
    setCurrentAttributes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAttributeChange = (index: number, field: "type" | "value", newValue: string) => {
    const updated = [...currentAttributes];
    updated[index][field] = newValue;
    if (field === "type") {
      updated[index].value = "";
      loadAttributeValues(newValue);
    }
    setCurrentAttributes(updated);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isEditMode && currentConfigId) {
      await update("/price-configs", currentConfigId, { pricePerSquareMeter: currentPrice });
    } else {
      const attributesObject = currentAttributes.reduce((acc, attr) => {
        if (attr.type && attr.value) {
          acc[attr.type] = attr.value;
        }
        return acc;
      }, {} as Record<string, string>);

      await create("/price-configs", { attributes: attributesObject, pricePerSquareMeter: currentPrice });
    }

    loadPriceConfigs();
    handleClose();
  };

  const columns: GridColDef<PriceConfig>[] = [
    { field: "combinationKey", headerName: "Combinación de Atributos", flex: 1 },
    { field: "pricePerSquareMeter", headerName: "Precio (€/m²)", type: "number", width: 200 },
    {
      field: "actions",
      type: "actions",
      headerName: "Acciones",
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem icon={<EditIcon />} label="Editar" onClick={() => handleOpen(params.row)} />,
        <GridActionsCellItem icon={<DeleteIcon />} label="Eliminar" onClick={() => handleDelete(params.id as string)} />,
      ],
    },
  ];

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h4">Configuración de Precios</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Añadir Configuración
        </Button>
      </Box>
      <Box sx={{ height: 600, width: "100%" }}>
        <DataGrid
          rows={priceConfigs}
          columns={columns}
          getRowId={(row) => row._id}
          localeText={esES.components.MuiDataGrid.defaultProps.localeText}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50]}
        />
      </Box>

      <Modal open={open} onClose={handleClose}>
        <Box sx={modalStyle} component="form" onSubmit={handleSubmit}>
          {/* --- Botón de Cierre --- */}
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}>
            <GridCloseIcon />
          </IconButton>

          <Typography variant="h6">{isEditMode ? "Editar" : "Añadir"} Configuración de Precio</Typography>

          <Typography sx={{ mt: 2, mb: 1 }}>Atributos de la Combinación</Typography>
          {currentAttributes.map((attr, index) => (
            <Box key={index} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Atributo</InputLabel>
                <Select value={attr.type} label="Atributo" disabled={isEditMode} onChange={(e) => handleAttributeChange(index, "type", e.target.value)}>
                  {allAttributeTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ flex: 1 }}>
                <InputLabel>Valor</InputLabel>
                <Select value={attr.value} label="Valor" disabled={isEditMode || !attr.type} onChange={(e) => handleAttributeChange(index, "value", e.target.value)}>
                  {(attributeValuesCache[attr.type] || []).map((val) => (
                    <MenuItem key={val._id} value={val.value}>
                      {val.label || val.value}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {!isEditMode && (
                <IconButton onClick={() => handleRemoveAttributeRow(index)} color="error">
                  <RemoveCircleOutlineIcon />
                </IconButton>
              )}
            </Box>
          ))}

          {!isEditMode && (
            <Button onClick={handleAddAttributeRow} sx={{ mt: 1 }}>
              + Añadir Atributo
            </Button>
          )}

          <TextField
            margin="normal"
            required
            fullWidth
            name="pricePerSquareMeter"
            label="Precio (€/m²)"
            type="number"
            value={currentPrice}
            onChange={(e) => setCurrentPrice(Number(e.target.value))}
          />

          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>
            Guardar
          </Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default PriceConfigsPage;
