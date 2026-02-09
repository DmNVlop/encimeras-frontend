import React, { useState, useEffect } from "react";
import { Box, Typography, CircularProgress, Button, Paper, Alert, TextField, Avatar, useTheme } from "@mui/material";
import Grid from "@mui/material/Grid";

// (Opcional) Iconos para los botones de forma
import StraightenIcon from "@mui/icons-material/Straighten";

// Importar HOOKS del Contexto
import { useQuoteDispatch, useQuoteState } from "@/context/QuoteContext";

// Importaciones REALES de tu API y Tipos
import { get } from "@/services/api.service";
import type { Material } from "@/interfases/materials.interfase";
import { MaterialAttributeModal } from "@/pages/public/common/MaterialAttributeModal";

import EncimeraPreview from "@/pages/public/common/EncimeraPreview/encimera-preview";

// Interfases y Tipos
import type { SelectionState, ShapeVariation } from "@/interfases/shape-variation.interfase";
import { shapeVariations } from "@/pages/public/common/shapes-step2";
import { selectOnFocus } from "@/utils/form.utils";
import type { MaterialConfirmationPayload } from "@/context/QuoteInterfases";

// =============================================================================
// COMPONENTE WizardStep2_ShapeAndMeasures
// =============================================================================

export const WizardStep2_ShapeAndMeasures: React.FC = () => {
  const theme = useTheme();

  // Conectar al Contexto
  const { wizardTempMaterial, mainPieces, selectedShapeId } = useQuoteState();

  // Buscamos la configuración visual de la forma actual
  const currentShapeVariation = shapeVariations.find((v) => v.id === selectedShapeId);

  const dispatch = useQuoteDispatch();

  // Estado para el Modal de "Cambiar Material"
  const [materialsList, setMaterialsList] = useState<Material[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [editingPieceIndex, setEditingPieceIndex] = useState<number | null>(null);
  const [isChangeMaterialModalOpen, setIsChangeMaterialModalOpen] = useState(false);
  const [materialToChange, setMaterialToChange] = useState<Material | null>(null);
  const [initialSelectionForChange, setInitialSelectionForChange] = useState<SelectionState | undefined>(undefined);

  // =======================================================================
  // LÓGICA DE CARGA Y HANDLERS
  // =======================================================================

  // Carga inicial de materiales
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setLoadingMaterials(true);
        const data = await get<Material[]>("/materials");
        setMaterialsList(data);
      } catch (error) {
        console.error("Error al cargar materiales:", error);
      } finally {
        setLoadingMaterials(false);
      }
    };
    fetchMaterials();
  }, []);

  // *** usa variation.id ***
  const handleSelectVariation = (variation: ShapeVariation) => {
    if (!wizardTempMaterial) return; // Safety check

    dispatch({
      type: "SET_SHAPE_VARIATION_AND_CREATE_PIECES",
      payload: {
        variationCode: variation.id, // Pasa el 'id'
        count: variation.count,
        defaultMeasurements: variation.defaultMeasurements,
        piecesLayout: variation.piecesLayout,
      },
    });
  };

  // --- Handlers para VISTA B (Edición de Piezas) ---

  const handleMeasureChange = (pieceIndex: number, field: "length_mm" | "width_mm", value: string) => {
    const currentPiece = mainPieces[pieceIndex];
    const newMeasurements = {
      ...currentPiece.measurements,
      [field]: parseInt(value, 10) || 0,
    };

    dispatch({
      type: "UPDATE_PIECE_MEASUREMENTS",
      payload: {
        pieceIndex: pieceIndex,
        measurements: newMeasurements,
      },
    });
  };

  // Abrir cambiar Material
  const handleOpenChangeMaterialModal = (pieceIndex: number) => {
    const piece = mainPieces[pieceIndex];
    const materialDef = materialsList.find((m) => m._id === piece.materialId);
    if (!materialDef) return;

    setEditingPieceIndex(pieceIndex); // Guarda el índice de la pieza a cambiar
    setMaterialToChange(materialDef); // Material para el modal
    setInitialSelectionForChange(piece.selectedAttributes); // Selección actual para pre-rellenar
    setIsChangeMaterialModalOpen(true); // Abre el modal
  };

  // Manejar Confirmacion de cambios
  const handleConfirmMaterialChange = (payload: MaterialConfirmationPayload) => {
    if (editingPieceIndex === null) return;

    dispatch({
      type: "UPDATE_MAIN_PIECE",
      payload: {
        pieceIndex: editingPieceIndex,
        data: {
          materialId: payload.materialId,
          selectedAttributes: payload.selectedAttributes,
        },
      },
    });

    // Cierra el modal y resetea estados
    setIsChangeMaterialModalOpen(false);
    setEditingPieceIndex(null);
    setMaterialToChange(null);
    setInitialSelectionForChange(undefined);
  };

  // =======================================================================
  // RENDERIZADO DEL COMPONENTE
  // =======================================================================

  // 1. Validar que el Step 1 esté completo
  if (!wizardTempMaterial) {
    return <Alert severity="warning">Por favor, vuelve al Paso 1 y selecciona un material base primero.</Alert>;
  }

  // 2. Renderizado Condicional: VISTA A o VISTA B

  // --- VISTA A: Selección de Forma (mainPieces está vacío) ---
  if (mainPieces.length === 0) {
    return (
      <Box sx={{ pb: 4 }}>
        {/* --- TÍTULO DEL PASO --- */}
        <Box sx={{ mb: 4, display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
            <StraightenIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: "bold", color: "#333" }}>
              Elige la forma principal
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Que forma tendrá tu encimera.
            </Typography>
          </Box>
        </Box>

        {/* Use reduce to group variations by their 'group' property */}
        {Object.entries(
          shapeVariations.reduce(
            (acc, variation) => {
              if (!acc[variation.group]) {
                acc[variation.group] = [];
              }
              acc[variation.group].push(variation);
              return acc;
            },
            {} as Record<string, ShapeVariation[]>,
          ),
        ).map(([groupName, variationsInGroup]) => (
          <Box key={groupName} sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ textTransform: "uppercase", mb: 2 }}>
              {groupName} ({variationsInGroup[0].count} {variationsInGroup[0].count > 1 ? "Piezas" : "Pieza"})
            </Typography>
            <Grid container spacing={2}>
              {variationsInGroup.map((variation) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={variation.id}>
                  <Paper
                    variant="outlined"
                    onClick={() => handleSelectVariation(variation)}
                    sx={{
                      p: 2,
                      textAlign: "center",
                      cursor: "pointer",
                      // height: "100%", // Make cards in a row equal height
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      alignItems: "center",
                      "&:hover": {
                        borderColor: "primary.main",
                        boxShadow: 2,
                      },
                    }}
                  >
                    {/* *** INICIO DE LA INTEGRACIÓN ***
                     */}
                    <Box
                      sx={{
                        width: "200px",
                        height: "120px",
                        alignContent: "center",
                        justifyItems: "center",
                        // width: "100%",
                        // maxWidth: "160px",
                        mx: "auto",
                        mb: 1,
                        "& .encimera-preview-container": {
                          minHeight: "80px",
                          gap: "2px",
                        },
                        "& .encimera-pieza": {
                          backgroundSize: "18px 18px",
                        },
                      }}
                    >
                      {/*
                       * Pasamos un objeto 'config' al componente EncimeraPreview,
                       * construido a partir de las propiedades de 'variation'.
                       */}
                      <EncimeraPreview
                        config={{
                          id: variation.id,
                          name: variation.name,
                          grid: variation.grid,
                          pieces: variation.pieces,
                        }}
                      />
                    </Box>
                    {/* *** FIN DE LA INTEGRACIÓN *** */}
                    <Typography variant="caption">{variation.name}</Typography> {/* MODIFICADO: usa variation.name */}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        ))}
      </Box>
    );
  }

  // --- VISTA B: Editor de Medidas (mainPieces está lleno) ---
  if (loadingMaterials) {
    return <CircularProgress />; // Espera a que cargue la lista de materiales
  }

  return (
    <Box sx={{ pb: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        {/* <Typography variant="h5" gutterBottom sx={{ mb: 0 }}>
          Paso 2: Define las medidas de cada pieza
        </Typography> */}

        {/* --- TÍTULO DEL PASO --- */}
        <Box sx={{ mb: 4, display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
            <StraightenIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: "bold", color: "#333" }}>
              Define las medidas de cada pieza
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Medidas finale que tendrá cada pieza de tu encimera.
            </Typography>
          </Box>
        </Box>

        <Button variant="outlined" size="small" onClick={() => dispatch({ type: "RESET_SHAPE" })}>
          Cambiar Forma Principal
        </Button>
      </Box>

      <Grid container spacing={3}>
        {mainPieces.map((piece, index) => {
          // Busca el nombre del material
          const materialName = materialsList.find((m) => m._id === piece.materialId)?.name || "Material desconocido";

          return (
            <Grid size={{ xs: 6 }} key={piece.id}>
              {" "}
              {/* Cambiado a xs:12 para ocupar ancho y dividir dentro */}
              <Paper elevation={2} sx={{ p: 0, overflow: "hidden" }}>
                <Grid container>
                  {/* COLUMNA IZQUIERDA: Inputs y Datos (Como en tu diseño) */}
                  <Grid size={{ xs: 12, md: 8 }} sx={{ p: 3 }}>
                    <Typography variant="h6" component="div" gutterBottom>
                      Pieza {index + 1}
                    </Typography>

                    {/* Info del material con botón de cambiar */}
                    <Box sx={{ mb: 2, p: 1.5, backgroundColor: "#f9f9f9", borderRadius: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        {materialName}
                      </Typography>
                      <Button size="small" variant="text" onClick={() => handleOpenChangeMaterialModal(index)} sx={{ p: 0, mt: 0.5 }}>
                        Cambiar material de esta pieza
                      </Button>
                    </Box>

                    {/* Inputs de Medidas */}
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="Largo (mm)"
                          name="length_mm"
                          type="number"
                          value={piece.measurements.length_mm}
                          onChange={(e) => handleMeasureChange(index, "length_mm", e.target.value)}
                          onFocus={selectOnFocus}
                          variant="outlined"
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="Ancho (mm)"
                          name="width_mm"
                          type="number"
                          value={piece.measurements.width_mm}
                          onChange={(e) => handleMeasureChange(index, "width_mm", e.target.value)}
                          onFocus={selectOnFocus}
                        />
                      </Grid>
                    </Grid>
                  </Grid>

                  {/* COLUMNA DERECHA: Visualización Contextual */}
                  <Grid
                    size={{ xs: 12, md: 4 }}
                    sx={{
                      backgroundColor: "#f4f6f8",
                      borderLeft: { md: "1px solid #e0e0e0" },
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      p: 2,
                    }}
                  >
                    {/* Aquí renderizamos la forma completa, pero iluminamos la pieza 'index' */}
                    {currentShapeVariation ? (
                      <Box sx={{ width: "100%" }}>
                        <EncimeraPreview
                          config={{
                            id: currentShapeVariation.id,
                            name: currentShapeVariation.name,
                            grid: currentShapeVariation.grid,
                            pieces: currentShapeVariation.pieces,
                          }}
                          highlightIndex={index} // <--- LA MAGIA ESTÁ AQUÍ
                        />
                        <Typography variant="caption" align="center" display="block" sx={{ mt: 1, color: "text.secondary" }}>
                          Estás editando la zona azul
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="caption">Forma no visualizable</Typography>
                    )}
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* --- Modal para "Cambiar Material" (lógica de Step 1) --- */}
      <MaterialAttributeModal
        open={isChangeMaterialModalOpen}
        onClose={() => {
          // Lógica de cierre para Step 2
          setIsChangeMaterialModalOpen(false);
          setEditingPieceIndex(null);
          setMaterialToChange(null);
          setInitialSelectionForChange(undefined);
        }}
        material={materialToChange}
        initialSelection={initialSelectionForChange} // Pasa la selección inicial
        onConfirm={handleConfirmMaterialChange} // Pasa el handler de Step 2
      />
    </Box>
  );
};
