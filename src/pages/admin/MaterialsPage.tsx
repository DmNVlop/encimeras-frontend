// src/pages/admin/MaterialsPage.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  Modal,
  TextField,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  OutlinedInput,
  Chip,
  CircularProgress,
  type SelectChangeEvent,
} from "@mui/material";
import { DataGrid, type GridColDef, GridActionsCellItem, type GridRowId, type GridRowSelectionModel } from "@mui/x-data-grid";
import { esES } from "@mui/x-data-grid/locales";
import { get, create, update, remove } from "../../services/apiService";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import type { Material } from "../../interfases/materials.interfase";
import type { AttributeToRead } from "../../interfases/attribute.interfase";

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
  const [currentMaterial, setCurrentMaterial] = useState<Partial<Material>>({});
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>({ type: "include", ids: new Set<GridRowId>() });
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [loading, setLoading] = useState(true);

  // --- FUNCIONALIDAD DE IMPORTACIÓN ---
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [groups, setGroups] = useState<AttributeToRead[]>([]);
  const [faces, setFaces] = useState<AttributeToRead[]>([]);
  const [categories, setCategories] = useState<AttributeToRead[]>([]);
  const [matTypes, setMatTypes] = useState<AttributeToRead[]>([]);
  const [thicknesses, setThicknesses] = useState<AttributeToRead[]>([]);
  const [finishes, setFinishes] = useState<AttributeToRead[]>([]);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const data = await get<Material>("/materials");
      setMaterials(data.map((m) => ({ ...m, id: m._id })));
    } catch (error) {
      console.error("Error al cargar los materiales:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
    const loadAttributes = async () => {
      const [groupData, faceData, categoryData, typeData, thicknessData, finishData] = await Promise.all([
        get<AttributeToRead>("/attributes", { params: { type: "MAT_GROUP" } }),
        get<AttributeToRead>("/attributes", { params: { type: "MAT_FACE" } }),
        get<AttributeToRead>("/attributes", { params: { type: "MAT_CATEGORY" } }),
        get<AttributeToRead>("/attributes", { params: { type: "MAT_TYPE" } }),
        get<AttributeToRead>("/attributes", { params: { type: "MAT_THICKNESS" } }),
        get<AttributeToRead>("/attributes", { params: { type: "MAT_FINISH" } }),
      ]);
      setGroups(groupData);
      setFaces(faceData);
      setCategories(categoryData);
      setMatTypes(typeData);
      setThicknesses(thicknessData);
      setFinishes(finishData);
    };
    loadAttributes();
  }, []);

  const handleOpen = (material?: Material) => {
    setIsEditMode(!!material);
    setCurrentMaterial(material || { isActive: true, faces: [], groups: [], thicknesses: [], finishes: [], category: "", type: "" });
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const data = {
      ...currentMaterial,
      name: (event.currentTarget.elements.namedItem("name") as HTMLInputElement).value,
      description: (event.currentTarget.elements.namedItem("description") as HTMLInputElement).value,
      isActive: (event.currentTarget.elements.namedItem("isActive") as HTMLInputElement).checked,
    };

    if (isEditMode) {
      await update("/materials", currentMaterial._id!, data);
    } else {
      await create("/materials", data);
    }
    loadMaterials();
    handleClose();
  };

  // --- FUNCIONALIDAD DE IMPORTACIÓN ---
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

  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setCurrentMaterial((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (event: SelectChangeEvent<string | string[]>) => {
    const { name, value } = event.target;
    setCurrentMaterial((prev) => ({ ...prev, [name]: value }));
  };

  const handleDeleteChip = (field: keyof Material, valueToDelete: string) => {
    setCurrentMaterial((prev) => {
      const currentValues = (prev[field] as string[]) || [];
      return {
        ...prev,
        [field]: currentValues.filter((value) => value !== valueToDelete),
      };
    });
  };

  const columns: GridColDef<Material>[] = [
    { field: "name", headerName: "Nombre", width: 200 },
    { field: "category", headerName: "Categoría", width: 130 },
    { field: "type", headerName: "Tipo", width: 130 },
    { field: "groups", headerName: "Grupos", width: 150, valueGetter: (params) => (Array.isArray(params?.row?.groups) ? params.row.groups.join(", ") : "") },
    { field: "faces", headerName: "Caras", width: 120, valueGetter: (params) => (Array.isArray(params?.row?.faces) ? params.row.faces.join(", ") : "") },
    { field: "isActive", headerName: "Activo", type: "boolean", width: 80 },
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
        <Typography variant="h4">Gestión de Materiales</Typography>
        <Box>
          {/* --- FUNCIONALIDAD DE IMPORTACIÓN --- */}
          <input type="file" accept=".csv" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileUpload} />
          <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => fileInputRef.current?.click()} sx={{ mr: 1 }}>
            Importar CSV
          </Button>
          {selectionModel.ids.size > 0 && (
            <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={handleDeleteSelected} sx={{ mr: 1 }}>
              Borrar ({selectionModel.ids.size})
            </Button>
          )}
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
            Añadir Material
          </Button>
        </Box>
      </Box>
      <Box sx={{ height: 600, width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
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
          />
        )}
      </Box>

      <Modal open={open} onClose={handleClose}>
        <Box sx={modalStyle} component="form" onSubmit={handleSubmit}>
          <Typography variant="h6"> {isEditMode ? "Editar" : "Añadir"} Material </Typography>
          <TextField margin="normal" required fullWidth name="name" label="Nombre" value={currentMaterial.name || ""} onChange={handleTextChange} />
          <TextField margin="normal" fullWidth name="description" label="Descripción" value={currentMaterial.description || ""} onChange={handleTextChange} />

          <FormControl fullWidth margin="normal" required>
            <InputLabel id="category-label"> Categoría </InputLabel>
            <Select labelId="category-label" name="category" value={currentMaterial.category || ""} onChange={handleSelectChange} label="Categoría">
              {categories.map((c) => (
                <MenuItem key={c._id} value={c.value}>
                  {" "}
                  {c.label || c.value}{" "}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal" required>
            <InputLabel id="type-label"> Tipo </InputLabel>
            <Select labelId="type-label" name="type" value={currentMaterial.type || ""} onChange={handleSelectChange} label="Tipo">
              {matTypes.map((t) => (
                <MenuItem key={t._id} value={t.value}>
                  {" "}
                  {t.label || t.value}{" "}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel id="groups-label"> Grupos </InputLabel>
            <Select
              labelId="groups-label"
              name="groups"
              multiple
              value={currentMaterial.groups || []}
              onChange={handleSelectChange}
              input={<OutlinedInput label="Grupos" />}
              renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} onDelete={() => handleDeleteChip("groups", value)} onMouseDown={(event) => event.stopPropagation()} />
                  ))}
                </Box>
              )}>
              {groups.map((g) => (
                <MenuItem key={g._id} value={g.value}>
                  {" "}
                  {g.label || g.value}{" "}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel id="faces-label"> Caras </InputLabel>
            <Select
              labelId="faces-label"
              name="faces"
              multiple
              value={currentMaterial.faces || []}
              onChange={handleSelectChange}
              input={<OutlinedInput label="Caras" />}
              renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} onDelete={() => handleDeleteChip("faces", value)} onMouseDown={(event) => event.stopPropagation()} />
                  ))}
                </Box>
              )}>
              {faces.map((f) => (
                <MenuItem key={f._id} value={f.value}>
                  {" "}
                  {f.label || f.value}{" "}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel id="thicknesses-label"> Grosores </InputLabel>
            <Select
              labelId="thicknesses-label"
              name="thicknesses"
              multiple
              value={currentMaterial.thicknesses || []}
              onChange={handleSelectChange}
              input={<OutlinedInput label="Grosores" />}
              renderValue={(selected: any) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {selected.map((value: any) => (
                    <Chip key={value} label={value} onDelete={() => handleDeleteChip("thicknesses", value)} onMouseDown={(event) => event.stopPropagation()} />
                  ))}
                </Box>
              )}>
              {thicknesses.map((t) => (
                <MenuItem key={t._id} value={t.value}>
                  {" "}
                  {t.label || t.value}{" "}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel id="finishes-label"> Acabados </InputLabel>
            <Select
              labelId="finishes-label"
              name="finishes"
              multiple
              value={currentMaterial.finishes || []}
              onChange={handleSelectChange}
              input={<OutlinedInput label="Acabados" />}
              renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} onDelete={() => handleDeleteChip("finishes", value)} onMouseDown={(event) => event.stopPropagation()} />
                  ))}
                </Box>
              )}>
              {finishes.map((f) => (
                <MenuItem key={f._id} value={f.value}>
                  {" "}
                  {f.label || f.value}{" "}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch checked={currentMaterial.isActive ?? true} name="isActive" onChange={(e) => setCurrentMaterial((prev) => ({ ...prev, isActive: e.target.checked }))} />
            }
            label="Activo"
          />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>
            {" "}
            Guardar{" "}
          </Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default MaterialsPage;
