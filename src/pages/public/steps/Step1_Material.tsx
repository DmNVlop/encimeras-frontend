// src/pages/public/steps/Step1_Material.tsx
import React, { useState, useEffect } from "react";
import { Box, Typography, Grid, Card, CardActionArea, CardContent, CircularProgress, Modal, Button, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { useQuoteDispatch } from "../../../context/QuoteContext";
import { get } from "../../../services/apiService";
import type { Material } from "../../../interfases/materials.interfase";

interface Step1Props {
  onNext: () => void;
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

const Step1_Material: React.FC<Step1Props> = ({ onNext }) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [open, setOpen] = useState(false);
  const dispatch = useQuoteDispatch();

  const [thickness, setThickness] = useState("");
  const [finish, setFinish] = useState("");
  const [group, setGroup] = useState("");
  const [face, setFace] = useState("");

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const data = await get<Material>("/materials");
        setMaterials(data.filter((m) => m.isActive));
      } catch (error) {
        console.error("Error al cargar materiales:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMaterials();
  }, []);

  const handleOpenModal = (material: Material) => {
    setSelectedMaterial(material);
    dispatch({ type: "SET_MATERIAL", payload: { materialId: material._id, materialName: material.name } });
    // Reseteamos las selecciones locales del modal
    setThickness("");
    setFinish("");
    setGroup("");
    setFace("");
    setOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedMaterial(null);
    setOpen(false);
  };

  const handleConfirmSelection = () => {
    if (!selectedMaterial || !thickness || !finish || !group || !face) return;

    dispatch({ type: "SET_DETAILS", payload: { thickness: Number(thickness), finish } });
    dispatch({ type: "SET_PRICE_OPTIONS", payload: { group, face } });
    setOpen(false);
    onNext();
  };

  // El botón de confirmar solo se activa si todo está seleccionado
  const isSelectionComplete = thickness && finish && group && face;

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", my: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        1. Elige el material para tu encimera
      </Typography>
      <Grid container spacing={3}>
        {materials.map((material) => (
          <Grid xs={12} sm={6} md={4} key={material._id}>
            <Card>
              <CardActionArea onClick={() => handleOpenModal(material)}>
                <CardContent>
                  <Typography gutterBottom variant="h5" component="div">
                    {material.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Categoría: {material.category}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Modal open={open} onClose={handleCloseModal}>
        <Box sx={modalStyle}>
          <Typography variant="h6" component="h2">
            Selecciona los detalles para: {selectedMaterial?.name}
          </Typography>
          <FormControl fullWidth margin="normal">
            <InputLabel>Grupo de Precio</InputLabel>
            <Select value={group} label="Grupo de Precio" onChange={(e) => setGroup(e.target.value)}>
              {selectedMaterial?.groups.map((g) => (
                <MenuItem key={g} value={g}>
                  {g}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Caras</InputLabel>
            <Select value={face} label="Caras" onChange={(e) => setFace(e.target.value)}>
              {selectedMaterial?.faces.map((f) => (
                <MenuItem key={f} value={f}>
                  {f}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Grosor (cm)</InputLabel>
            <Select value={thickness} label="Grosor (cm)" onChange={(e) => setThickness(e.target.value)}>
              {selectedMaterial?.thicknesses.map((t) => (
                <MenuItem key={t} value={t}>
                  {t} cm
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Acabado</InputLabel>
            <Select value={finish} label="Acabado" onChange={(e) => setFinish(e.target.value)}>
              {selectedMaterial?.finishes.map((f) => (
                <MenuItem key={f} value={f}>
                  {f}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={handleConfirmSelection} disabled={!isSelectionComplete}>
            Confirmar y Siguiente
          </Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default Step1_Material;
