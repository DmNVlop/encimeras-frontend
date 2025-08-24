// src/pages/admin/CutoutsPage.tsx
import React, { useState, useEffect, useRef } from "react";
import { Box, Typography, Button, Modal, TextField, Select, MenuItem, InputLabel, FormControl } from "@mui/material";
import { DataGrid, GridActionsCellItem } from "@mui/x-data-grid";
import { get, create, update, remove } from "../../services/apiService";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import type { GridColDef } from "@mui/x-data-grid";
import { esES } from "@mui/x-data-grid/locales";

// Define la estructura del tipo Cutout
interface Cutout {
  _id: string;
  name: string;
  price: number;
  type: "SINK" | "HOB" | "OTHER";
}

const modalStyle = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
};

const CutoutsPage: React.FC = () => {
  const [cutouts, setCutouts] = useState<Cutout[]>([]);
  const [open, setOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentCutout, setCurrentCutout] = useState<Partial<Cutout>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadCutouts = async () => {
    try {
      const data = await get<Cutout>("/cutouts");
      setCutouts(data.map((c) => ({ ...c, id: c._id })));
    } catch (error) {
      alert(`Error al cargar los cortes: ${error}`);
    }
  };

  useEffect(() => {
    loadCutouts();
  }, []);

  const handleOpen = (cutout?: Cutout) => {
    setIsEditMode(!!cutout);
    setCurrentCutout(cutout || { type: "OTHER" });
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este corte?")) {
      try {
        await remove("/cutouts", id);
        loadCutouts();
      } catch (error) {
        alert(`Error al eliminar: ${error}`);
      }
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

    try {
      if (isEditMode) {
        await update("/cutouts", currentCutout._id!, data);
      } else {
        await create("/cutouts", data);
      }
      loadCutouts();
      handleClose();
    } catch (error) {
      alert(`Error al guardar: ${error}`);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter((line) => line.trim() !== "");
      const header = lines.shift()?.trim().split(";") || [];

      const cutoutsToCreate = [];
      for (const line of lines) {
        const values = line.trim().split(";");
        const cutoutData: any = {};
        header.forEach((key, index) => {
          const value = values[index];
          if (key === "price") {
            cutoutData[key] = Number(value.replace(",", "."));
          } else {
            cutoutData[key] = value;
          }
        });
        cutoutsToCreate.push(create("/cutouts", cutoutData));
      }

      try {
        await Promise.all(cutoutsToCreate);
        alert(`${cutoutsToCreate.length} cortes importados con éxito.`);
        loadCutouts();
      } catch (error) {
        alert("Hubo un error al importar. Revisa la consola.");
        console.error("Error en la importación:", error);
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const columns: GridColDef[] = [
    { field: "name", headerName: "Nombre", width: 350 },
    { field: "price", headerName: "Precio (€)", type: "number", width: 150 },
    { field: "type", headerName: "Tipo", width: 150 },
    {
      field: "actions",
      type: "actions",
      headerName: "Acciones",
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem icon={<EditIcon />} label="Editar" onClick={() => handleOpen(params.row as Cutout)} />,
        <GridActionsCellItem icon={<DeleteIcon />} label="Eliminar" onClick={() => handleDelete(params.id as string)} />,
      ],
    },
  ];

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h4">Gestión de Cortes y Acabados</Typography>
        <Box>
          <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} />
          <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={handleImportClick} sx={{ mr: 1 }}>
            Importar CSV
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
            Añadir Corte
          </Button>
        </Box>
      </Box>
      <Box sx={{ height: 600, width: "100%" }}>
        <DataGrid
          rows={cutouts}
          columns={columns}
          getRowId={(row) => row._id}
          localeText={esES.components.MuiDataGrid.defaultProps.localeText}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          pageSizeOptions={[10, 25, 50]}
        />
      </Box>

      <Modal open={open} onClose={handleClose}>
        <Box sx={modalStyle} component="form" onSubmit={handleSubmit}>
          <Typography variant="h6">{isEditMode ? "Editar" : "Añadir"} Corte</Typography>
          <TextField margin="normal" required fullWidth name="name" label="Nombre" defaultValue={currentCutout.name} />
          <TextField margin="normal" required fullWidth name="price" label="Precio (€)" type="number" defaultValue={currentCutout.price} />
          <FormControl fullWidth margin="normal">
            <InputLabel id="type-select-label">Tipo</InputLabel>
            <Select labelId="type-select-label" name="type" label="Tipo" defaultValue={currentCutout.type || "OTHER"}>
              <MenuItem value="SINK">Fregadero (SINK)</MenuItem>
              <MenuItem value="HOB">Vitrocerámica (HOB)</MenuItem>
              <MenuItem value="OTHER">Otro (OTHER)</MenuItem>
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
