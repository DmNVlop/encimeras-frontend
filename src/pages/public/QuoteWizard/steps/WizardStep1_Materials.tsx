import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Avatar,
  Card,
  CardActionArea,
  CardMedia, // Para la imagen "vistosa"
  CardContent,
  Alert, // Para feedback al usuario
  useTheme,
} from "@mui/material";
import Grid from "@mui/material/Grid";

import TextureIcon from "@mui/icons-material/Texture";

// Importar HOOKS del Contexto
import { useQuoteDispatch, useQuoteState, type MaterialConfirmationPayload } from "@/context/QuoteContext";

// Importar API Service
import { get } from "@/services/apiService";

import type { Material } from "@/interfases/materials.interfase";
import { MaterialAttributeModal } from "@/pages/public/common/MaterialAttributeModal";

// =============================================================================
// COMPONENTE WizardStep1_Materials
// =============================================================================

export const WizardStep1_Materials: React.FC = () => {
  const theme = useTheme();

  // 1. Conectar al Contexto
  const dispatch = useQuoteDispatch();
  // Leemos el estado para mostrar feedback (Alert)
  const { wizardTempMaterial } = useQuoteState();

  // 2. Estados de UI y Datos (Lógica de Step1)
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [materialForModal, setMaterialForModal] = useState<Material | null>(null);

  // =======================================================================
  // LÓGICA DE CARGA Y HANDLERS (Reutilizada de Step1)
  // =======================================================================

  // Carga inicial de materiales (GET /materials)
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setLoadingMaterials(true);
        const data = await get<Material>("/materials");
        setMaterials(data);
      } catch (error) {
        console.error("Error al cargar materiales:", error);
      } finally {
        setLoadingMaterials(false);
      }
    };
    fetchMaterials();
  }, []); // Carga única

  // Abrir el modal
  const handleOpenModal = (material: Material) => {
    setMaterialForModal(material);
    // const initialSelection = material.selectableAttributes.reduce((acc, attr) => ({ ...acc, [attr]: "" }), {});
    setIsModalOpen(true);
  };

  // Cerrar el modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setMaterialForModal(null);
  };

  // ---------------------------------------------------------------------
  // ¡ACCIÓN CLAVE! Confirmar y despachar al Context
  // ---------------------------------------------------------------------
  const handleConfirmationFromModal = (payload: MaterialConfirmationPayload) => {
    dispatch({ type: "SET_WIZARD_MATERIAL", payload });
    handleCloseModal(); // Cierra el modal después de confirmar
  };
  // ---------------------------------------------------------------------

  // Habilitar botón de confirmar
  // const isSelectionComplete = materialForModal ? materialForModal.selectableAttributes.every((attr) => modalSelection[attr]) : false;

  // =======================================================================
  // RENDERIZADO DEL COMPONENTE
  // =======================================================================

  if (loadingMaterials) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      {/* --- TÍTULO DEL PASO --- */}
      <Box sx={{ mb: 4, display: "flex", alignItems: "center", gap: 2 }}>
        <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
          <TextureIcon />
        </Avatar>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: "bold", color: "#333" }}>
            Elige tu Material
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Material base para la construcción de tu encimera.
          </Typography>
        </Box>
      </Box>

      {/* --- Feedback para el usuario --- */}
      {wizardTempMaterial && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Material seleccionado: <strong>{wizardTempMaterial.materialName}</strong>. Ya puedes pulsar "Siguiente".
        </Alert>
      )}

      {/* --- Parrilla de Cards "Vistosas" --- */}
      <Grid container spacing={3}>
        {materials.map((material) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={material._id}>
            <Card
              onClick={() => handleOpenModal(material)}
              // Resaltamos la card si es la seleccionada
              raised={wizardTempMaterial?.materialId === material._id}
              sx={{
                border: wizardTempMaterial?.materialId === material._id ? 2 : "none",
                borderColor: "primary.main",
              }}
            >
              <CardActionArea>
                <CardMedia
                  component="img"
                  height="160"
                  // (Asumimos que la API devuelve 'imageUrl')
                  image={(material as any).imageUrl || "https_via_placeholder_com_300.png"}
                  alt={material.name}
                />
                <CardContent>
                  <Typography gutterBottom variant="h6" component="div">
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

      {/* --- Modal de Selección (Lógica de Step1) --- */}
      <MaterialAttributeModal
        open={isModalOpen}
        onClose={handleCloseModal}
        material={materialForModal}
        onConfirm={handleConfirmationFromModal} // Pasa la nueva función wrapper
      />
    </Box>
  );
};
