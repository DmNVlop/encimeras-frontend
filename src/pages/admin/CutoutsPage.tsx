// src/pages/admin/CutoutsPage.tsx
import React, { useState, useEffect } from "react";
import { Box, Typography, Button, Modal, TextField, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { DataGrid, type GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import { esES } from "@mui/x-data-grid/locales";
import { get, create, update, remove } from "@/services/api.service";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

// Interfaces
interface Cutout {
  _id: string;
  name: string;
  price: number;
  type: string;
}

interface Attribute {
  _id: string;
  value: string;
  label?: string;
}

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

const CutoutsPage: React.FC = () => {
  const [cutouts, setCutouts] = useState<Cutout[]>([]);
  const [open, setOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentCutout, setCurrentCutout] = useState<Partial<Cutout>>({});
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });

  // 1. Nuevo estado para guardar los tipos de corte
  const [cutoutTypes, setCutoutTypes] = useState<Attribute[]>([]);

  const loadCutouts = async () => {
    const data = await get<Cutout[]>("/cutouts");
    setCutouts(data);
  };

  // 2. Cargamos los tipos de corte desde la API de atributos
  useEffect(() => {
    loadCutouts();
    const loadCutoutTypes = async () => {
      const types = await get<Attribute[]>("/attributes", { params: { type: "CUTOUT_TYPE" } });
      setCutoutTypes(types);
    };
    loadCutoutTypes();
  }, []);

  const handleOpen = (cutout?: Cutout) => {
    setIsEditMode(!!cutout);
    setCurrentCutout(cutout || {});
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este corte?")) {
      await remove("/cutouts", [id]);
      loadCutouts();
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = {
      name: formData.get("name"),
      price: Number(formData.get("price")),
      type: formData.get("type"),
    };

    if (isEditMode) {
      await update("/cutouts", currentCutout._id!, data);
    } else {
      await create("/cutouts", data);
    }
    loadCutouts();
    handleClose();
  };

  const columns: GridColDef<Cutout>[] = [
    { field: "name", headerName: "Nombre", width: 300 },
    { field: "price", headerName: "Precio (€)", type: "number", width: 150 },
    { field: "type", headerName: "Tipo", width: 200 },
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
        <Typography variant="h4">Gestión de Cortes y Acabados</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Añadir Corte
        </Button>
      </Box>
      <Box sx={{ height: "calc(100vh - 180px)", width: "100%" }}>
        <DataGrid
          rows={cutouts}
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
          <Typography variant="h6">{isEditMode ? "Editar" : "Añadir"} Corte</Typography>
          <TextField margin="normal" required fullWidth name="name" label="Nombre" defaultValue={currentCutout.name} />
          <TextField margin="normal" required fullWidth name="price" label="Precio (€)" type="number" defaultValue={currentCutout.price} />

          {/* 3. Reemplazamos el TextField por un Select */}
          <FormControl fullWidth margin="normal" required>
            <InputLabel id="cutout-type-label">Tipo</InputLabel>
            <Select labelId="cutout-type-label" name="type" defaultValue={currentCutout.type || ""} label="Tipo">
              {cutoutTypes.map((type) => (
                <MenuItem key={type._id} value={type.value}>
                  {type.label || type.value}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>
            Guardar
          </Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default CutoutsPage;
