// src/pages/admin/MaterialsPage.tsx
import React, { useState, useEffect, useRef } from "react";
import { Box, Typography, Button, Modal, TextField, Switch, FormControlLabel } from "@mui/material";
import { DataGrid, GridActionsCellItem } from "@mui/x-data-grid";
import { get, create, update, remove } from "../../services/apiService";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import type { GridColDef } from "@mui/x-data-grid";
import { esES } from "@mui/x-data-grid/locales";

// Define la estructura de datos real del material
interface Material {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  pricePerSquareMeter: number;
  thicknesses: number[];
  finishes: string[];
  category: string;
  isActive: boolean;
}

// Define la estructura de los datos para el formulario (con arrays como strings)
interface MaterialFormData {
  _id?: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  pricePerSquareMeter?: number;
  thicknesses?: string;
  finishes?: string;
  category?: string;
  isActive?: boolean;
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
  maxHeight: "90vh",
  overflowY: "auto",
};

const MaterialsPage: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [open, setOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [currentMaterial, setCurrentMaterial] = useState<MaterialFormData>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMaterials = async () => {
    const data = await get<Material>("/materials");
    setMaterials(data.map((m) => ({ ...m, id: m._id })));
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  const handleOpen = (material?: Material) => {
    setIsEditMode(!!material);
    const materialForForm: MaterialFormData = material ? { ...material, thicknesses: material.thicknesses.join(", "), finishes: material.finishes.join(", ") } : { isActive: true };
    setCurrentMaterial(materialForForm);
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este material?")) {
      await remove("/materials", id);
      loadMaterials();
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const thicknessesStr = (formData.get("thicknesses") as string) || "";
    const finishesStr = (formData.get("finishes") as string) || "";

    const data = {
      name: formData.get("name"),
      description: formData.get("description"),
      imageUrl: formData.get("imageUrl"),
      pricePerSquareMeter: Number(formData.get("pricePerSquareMeter")),
      category: formData.get("category"),
      thicknesses: thicknessesStr
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => !isNaN(n) && n > 0),
      finishes: finishesStr
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s),
      isActive: formData.get("isActive") === "on",
    };

    if (isEditMode) {
      await update("/materials", currentMaterial._id!, data);
    } else {
      await create("/materials", data);
    }
    loadMaterials();
    handleClose();
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

      const materialsToCreate = [];
      for (const line of lines) {
        const values = line.trim().split(";");
        const materialData: any = {};
        header.forEach((key, index) => {
          const value = values[index];
          if (key === "pricePerSquareMeter") {
            materialData[key] = Number(value);
          } else if (key === "thicknesses") {
            materialData[key] = value
              .split(",")
              .map((s) => Number(s.trim()))
              .filter((n) => !isNaN(n) && n > 0);
          } else if (key === "finishes") {
            materialData[key] = value
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s);
          } else if (key === "isActive") {
            materialData[key] = value.toLowerCase() === "true";
          } else {
            materialData[key] = value;
          }
        });
        materialsToCreate.push(create("/materials", materialData));
      }

      try {
        await Promise.all(materialsToCreate);
        alert(`${materialsToCreate.length} materiales importados con éxito.`);
        loadMaterials();
      } catch (error) {
        alert("Hubo un error al importar algunos materiales. Revisa la consola para más detalles.");
        console.error("Error en la importación:", error);
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const columns: GridColDef[] = [
    { field: "name", headerName: "Nombre", width: 250 },
    { field: "category", headerName: "Categoría", width: 150 },
    { field: "pricePerSquareMeter", headerName: "Precio (€/m²)", type: "number", width: 150 },
    { field: "isActive", headerName: "Activo", type: "boolean", width: 100 },
    {
      field: "actions",
      type: "actions",
      headerName: "Acciones",
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem icon={<EditIcon />} label="Editar" onClick={() => handleOpen(params.row as Material)} />,
        <GridActionsCellItem icon={<DeleteIcon />} label="Eliminar" onClick={() => handleDelete(params.id as string)} />,
      ],
    },
  ];

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h4">Gestión de Materiales</Typography>
        <Box>
          <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} />
          <Button variant="outlined" startIcon={<UploadFileIcon />} title="Importar CSV" onClick={handleImportClick} sx={{ mr: 1 }}>
            {/* Importar CSV */}
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
            Añadir Material
          </Button>
        </Box>
      </Box>
      <Box sx={{ height: 600, width: "100%" }}>
        <DataGrid
          rows={materials}
          columns={columns}
          pageSizeOptions={[10, 25, 50]}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          getRowId={(row) => row._id}
          localeText={esES.components.MuiDataGrid.defaultProps.localeText}
        />
      </Box>

      <Modal open={open} onClose={handleClose}>
        <Box sx={modalStyle} component="form" onSubmit={handleSubmit}>
          <Typography variant="h6">{isEditMode ? "Editar" : "Añadir"} Material</Typography>
          <TextField margin="normal" required fullWidth name="name" label="Nombre" defaultValue={currentMaterial.name} />
          <TextField margin="normal" fullWidth name="description" label="Descripción" defaultValue={currentMaterial.description} />
          <TextField margin="normal" fullWidth name="imageUrl" label="URL de la Imagen" defaultValue={currentMaterial.imageUrl} />
          <TextField margin="normal" required fullWidth name="category" label="Categoría" defaultValue={currentMaterial.category} />
          <TextField margin="normal" required fullWidth name="pricePerSquareMeter" label="Precio (€/m²)" type="number" defaultValue={currentMaterial.pricePerSquareMeter} />
          <TextField
            margin="normal"
            required
            fullWidth
            name="thicknesses"
            label="Grosores (cm, separados por coma)"
            helperText="Ej: 2, 3, 5"
            defaultValue={currentMaterial.thicknesses}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="finishes"
            label="Acabados (separados por coma)"
            helperText="Ej: Pulido, Mate"
            defaultValue={currentMaterial.finishes}
          />
          <FormControlLabel control={<Switch defaultChecked={currentMaterial.isActive ?? true} name="isActive" />} label="Activo" />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>
            Guardar
          </Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default MaterialsPage;
