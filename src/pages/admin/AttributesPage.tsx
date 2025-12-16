// src/pages/admin/AttributesPage.tsx
import React, { useState, useEffect } from "react";
import { Box, Typography, Button, Modal, TextField, Switch, FormControlLabel, Select, MenuItem, InputLabel, FormControl } from "@mui/material";
import { DataGrid, type GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import { esES } from "@mui/x-data-grid/locales";
import { get, create, update, remove } from "@/services/apiService";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import type { Attribute } from "@/interfases/attribute.interfase";

const modalStyle = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 500,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
};

const AttributesPage: React.FC = () => {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [open, setOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentAttribute, setCurrentAttribute] = useState<Partial<Attribute>>({});
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [filterType, setFilterType] = useState("");

  const [allTypes, setAllTypes] = useState<string[]>([
    "MAT_GRUPO",
    "MAT_CARA",
    "MAT_ESPESOR",
    "MAT_ACABADO",
    "MAT_TEXTURA",
    "MAT_CATEGORIA",
    "MAT_TIPO",
    "WIDTH_RANGE",
  ]);

  const loadAttributes = async () => {
    const params = filterType ? { type: filterType } : {};
    const data = await get<Attribute>("/attributes", { params });
    setAttributes(data);
  };

  const loadAllTypes = async () => {
    const allAttrs = await get<Attribute>("/attributes");
    const uniqueTypes = Array.from(new Set(allAttrs.map((attr) => attr.type)));
    setAllTypes(Array.from(new Set([...allTypes, ...uniqueTypes])));
  };

  useEffect(() => {
    loadAttributes();
  }, [filterType]);

  useEffect(() => {
    loadAllTypes();
  }, []);

  const handleOpen = (attribute?: Attribute) => {
    setIsEditMode(!!attribute);
    setCurrentAttribute(attribute || { isActive: true });
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este atributo?")) {
      await remove("/attributes", [id]);
      loadAttributes();
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = {
      type: formData.get("type"),
      value: formData.get("value"),
      label: formData.get("label"),
      isActive: formData.get("isActive") === "on",
    };

    if (isEditMode) {
      await update("/attributes", currentAttribute._id!, data);
    } else {
      await create("/attributes", data);
    }
    loadAttributes();
    handleClose();
  };

  const columns: GridColDef<Attribute>[] = [
    { field: "type", headerName: "Tipo", width: 200 },
    { field: "value", headerName: "Valor", width: 200 },
    { field: "label", headerName: "Etiqueta", width: 200 },
    { field: "isActive", headerName: "Activo", type: "boolean", width: 100 },
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
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
          <Typography variant="h4" sx={{ mr: 4 }}>
            Gestión de Atributos
          </Typography>

          <FormControl sx={{ minWidth: 240, mb: 2 }}>
            <InputLabel id="filter-type-label">Filtrar por tipo</InputLabel>
            <Select labelId="filter-type-label" value={filterType} label="Filtrar por tipo" onChange={(e) => setFilterType(e.target.value as string)}>
              <MenuItem value="">
                <em>Todos</em>
              </MenuItem>
              {allTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
            Añadir Atributo
          </Button>
        </Box>
      </Box>

      <Box sx={{ height: "calc(100vh - 200px)", width: "100%" }}>
        <DataGrid
          rows={attributes}
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
          <Typography variant="h6">{isEditMode ? "Editar" : "Añadir"} Atributo</Typography>
          {/* --- MODIFICACIÓN: Actualizamos el texto de ejemplo --- */}
          <TextField margin="normal" required fullWidth name="type" label="Tipo (ej. MAT_GROUP, MAT_TYPE)" defaultValue={currentAttribute.type} />
          <TextField margin="normal" required fullWidth name="value" label="Valor (ej. Basic, AGLOMERADO)" defaultValue={currentAttribute.value} />
          <TextField margin="normal" fullWidth name="label" label="Etiqueta (Opcional, ej. Aglomerado)" defaultValue={currentAttribute.label} />
          <FormControlLabel control={<Switch defaultChecked={currentAttribute.isActive ?? true} name="isActive" />} label="Activo" />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>
            Guardar
          </Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default AttributesPage;
