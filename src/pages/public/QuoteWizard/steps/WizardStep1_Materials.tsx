import React, { useState, useEffect, useMemo } from "react";
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
import { useQuoteDispatch, useQuoteState } from "@/context/QuoteContext";

// Importar API Service
import { get } from "@/services/api.service";

import type { Material } from "@/interfases/materials.interfase";
import { MaterialAttributeModal } from "@/pages/public/common/MaterialAttributeModal";
import { MaterialsFilter } from "@/pages/public/components/MaterialsFilter";
import { CategoryFilter } from "../../components/CategoryFilter";
import type { MaterialConfirmationPayload } from "@/context/QuoteInterfases";

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

  // --- ESTADO PARA EL FILTRO ---
  const [searchTerm, setSearchTerm] = useState("");

  // --- ESTADO PARA CATEGORÍA ---
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Calcular dinámicamente las categorías disponibles basadas en los materiales cargados
  const uniqueCategories = useMemo(() => {
    const categories = materials.map((m) => m.category).filter(Boolean); // Extraer categorías
    return Array.from(new Set(categories)); // Eliminar duplicados
  }, [materials]);

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

        // AQUI ESTÁ LA MAGIA
        // Pasamos el objeto de configuración con 'params'
        const data = await get<Material[]>("/materials", {
          params: {
            // Lista separada por comas de los campos que REALMENTE usas en la vista y el modal
            fields: "name,category,imageUrl,selectableAttributes,_id",
          },
        });

        console.log("Materiales optimizados cargados:", data);
        setMaterials(data);
      } catch (error) {
        console.error("Error al cargar materiales:", error);
      } finally {
        setLoadingMaterials(false);
      }
    };
    fetchMaterials();
  }, []);

  // =======================================================================
  // LÓGICA DE FILTRADO (useMemo)
  // =======================================================================
  // Esta lógica se ejecuta automáticamente cuando cambia 'searchTerm', 'materials' o 'selectedCategory'.
  // Filtramos por Nombre o por Categoría.
  const filteredMaterials = useMemo(() => {
    return materials.filter((mat) => {
      // 1. Filtro de Texto (Nombre)
      // Nota: He quitado la búsqueda por categoría en texto para evitar redundancia,
      // pero puedes dejarla si quieres que el buscador de texto también busque categorías.
      const lowerTerm = searchTerm.toLowerCase();
      const matchText = !searchTerm || mat.name.toLowerCase().includes(lowerTerm);

      // 2. Filtro de Categoría (Select)
      const matchCategory = selectedCategory === "all" || mat.category === selectedCategory;

      // Ambas condiciones deben cumplirse
      return matchText && matchCategory;
    });
  }, [materials, searchTerm, selectedCategory]);

  // =======================================================================
  // HANDLERS
  // =======================================================================
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
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "top", gap: 2 }}>
        {/* --- TÍTULO DEL PASO --- */}
        <Box sx={{ display: "flex", alignItems: "top", gap: 2 }}>
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

        {/* --- FILTRO / BUSCADOR --- */}
        {/* Solo mostramos el filtro si hay materiales cargados */}
        {materials.length > 0 && (
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap", // Para que se adapte a móviles
              justifyContent: "flex-end",
              width: "100%",
              maxWidth: 800,
            }}
          >
            {/* Componente Nuevo */}
            <CategoryFilter categories={uniqueCategories} selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />

            {/* Componente Existente (ajustamos width para que convivan bien) */}
            <Box sx={{ flexGrow: 1, minWidth: 250 }}>
              <MaterialsFilter searchTerm={searchTerm} onSearchChange={setSearchTerm} />
            </Box>
          </Box>
        )}
      </Box>

      {/* --- Feedback para el usuario --- */}
      {wizardTempMaterial && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Material seleccionado: <strong>{wizardTempMaterial.materialName}</strong>. Ya puedes pulsar "Siguiente".
        </Alert>
      )}

      {/* --- GRID (Iteramos sobre filteredMaterials) --- */}
      <Grid container spacing={3}>
        {filteredMaterials.length > 0 ? (
          filteredMaterials.map((material) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={material._id}>
              <Card
                onClick={() => handleOpenModal(material)}
                // Resaltamos la card si es la seleccionada
                raised={wizardTempMaterial?.materialId === material._id}
                sx={{
                  border: wizardTempMaterial?.materialId === material._id ? 2 : "none",
                  borderColor: "primary.main",
                  height: "100%", // Asegurar altura uniforme
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <CardActionArea>
                  <CardMedia
                    component="img"
                    height="160"
                    // (Asumimos que la API devuelve 'imageUrl')
                    image={(material as any).imageUrl || "https_via_placeholder_com_300.png"}
                    alt={material.name}
                    sx={{ objectFit: "cover" }}
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
          ))
        ) : (
          /* Estado vacío si la búsqueda no arroja resultados */
          <Box sx={{ width: "100%", textAlign: "center", mt: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No se encontraron materiales que coincidan con "{searchTerm}".
            </Typography>
          </Box>
        )}
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
