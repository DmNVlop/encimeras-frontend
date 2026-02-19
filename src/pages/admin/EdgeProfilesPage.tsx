// src/pages/admin/EdgeProfilesPage.tsx
import React, { useState, useEffect, useRef } from "react";
import { Box, Typography, Button, Modal, TextField } from "@mui/material";
import { DataGrid, GridActionsCellItem } from "@mui/x-data-grid";
import { get, create, update, remove } from "@/services/api.service";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import type { GridColDef } from "@mui/x-data-grid";
import { esES } from "@mui/x-data-grid/locales";
import AdminPageTitle from "./components/AdminPageTitle";

// Define la estructura del tipo EdgeProfile
interface EdgeProfile {
  _id: string;
  name: string;
  pricePerMeter: number;
  imageUrl?: string;
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

const EdgeProfilesPage: React.FC = () => {
  const [profiles, setProfiles] = useState<EdgeProfile[]>([]);
  const [open, setOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<Partial<EdgeProfile>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProfiles = async () => {
    try {
      const data = await get<EdgeProfile[]>("/edge-profiles");
      setProfiles(data.map((p) => ({ ...p, id: p._id })));
    } catch (error) {
      alert(`Error al cargar los perfiles: ${error}`);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const handleOpen = (profile?: EdgeProfile) => {
    setIsEditMode(!!profile);
    setCurrentProfile(profile || {});
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este perfil de canto?")) {
      try {
        await remove("/edge-profiles", [id]);
        loadProfiles();
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
      pricePerMeter: Number(formData.get("pricePerMeter")),
      imageUrl: formData.get("imageUrl"),
    };

    try {
      if (isEditMode) {
        await update("/edge-profiles", currentProfile._id!, data);
      } else {
        await create("/edge-profiles", data);
      }
      loadProfiles();
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
      const headerLine = lines.shift()?.trim();

      if (!headerLine) {
        alert("El archivo CSV está vacío o no tiene cabecera.");
        return;
      }

      const header = headerLine.split(";");
      const profilesToCreate = [];

      for (const line of lines) {
        const values = line.trim().split(";");
        const profileData: any = {};
        header.forEach((key, index) => {
          const value = values[index];
          if (key === "pricePerMeter") {
            profileData[key] = Number(value.replace(",", ".")); // Reemplaza coma por punto para decimales
          } else {
            profileData[key] = value;
          }
        });
        profilesToCreate.push(create("/edge-profiles", profileData));
      }

      try {
        await Promise.all(profilesToCreate);
        alert(`${profilesToCreate.length} perfiles importados con éxito.`);
        loadProfiles();
      } catch (error) {
        alert("Hubo un error al importar algunos perfiles. Revisa la consola.");
        console.error("Error en la importación:", error);
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const columns: GridColDef[] = [
    { field: "name", headerName: "Nombre", width: 300 },
    { field: "pricePerMeter", headerName: "Precio (€)", type: "number", width: 200 },
    {
      field: "actions",
      type: "actions",
      headerName: "Acciones",
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem icon={<EditIcon />} label="Editar" onClick={() => handleOpen(params.row as EdgeProfile)} />,
        <GridActionsCellItem icon={<DeleteIcon />} label="Eliminar" onClick={() => handleDelete(params.id as string)} />,
      ],
    },
  ];

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <AdminPageTitle>Gestión de Tipos de Canto</AdminPageTitle>
        <Box>
          <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} />
          <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={handleImportClick} sx={{ mr: 1 }}>
            {/* Importar CSV */}
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
            Añadir Canto
          </Button>
        </Box>
      </Box>
      <Box sx={{ height: "calc(100vh - 180px)", width: "100%" }}>
        <DataGrid
          rows={profiles}
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
          <Typography variant="h6">{isEditMode ? "Editar" : "Añadir"} Perfil de Canto</Typography>
          <TextField margin="normal" required fullWidth name="name" label="Nombre" defaultValue={currentProfile.name} />
          <TextField
            margin="normal"
            required
            fullWidth
            name="pricePerMeter"
            label="Precio (€/metro)"
            type="number"
            defaultValue={currentProfile.pricePerMeter}
          />
          <TextField margin="normal" fullWidth name="imageUrl" label="URL de la Imagen" defaultValue={currentProfile.imageUrl} />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>
            Guardar
          </Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default EdgeProfilesPage;
