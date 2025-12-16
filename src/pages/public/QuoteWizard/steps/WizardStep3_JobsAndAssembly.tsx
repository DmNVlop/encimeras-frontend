import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  useTheme,
  Chip,
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
  IconButton,
  Tooltip,
  Divider,
  Fade,
} from "@mui/material";
import LinkIcon from "@mui/icons-material/Link";
import HandymanIcon from "@mui/icons-material/Handyman";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ConstructionIcon from "@mui/icons-material/Construction";

// --- IMPORTACIONES ---
import { useQuoteDispatch, useQuoteState, type AppliedAddon } from "@/context/QuoteContext";
import { get } from "@/services/apiService";
import type { Material } from "@/interfases/materials.interfase";
import type { Addon } from "@/interfases/addon.interfase";
import { MeasurementInput } from "@/components/admin/inputs/MeasurementInput";
import { ProjectPiecesSelector } from "../../components/ProjectPiecesSelector";

// --- CONSTANTES VISUALES ---
const IMAGE_PATH = "/addons";
const DEFAULT_IMAGE = `${IMAGE_PATH}/default_assembly.jpg`;

// --- SUB-COMPONENTES INTERNOS PARA MEJORAR LA LECTURA ---

/**
 * Tarjeta del catálogo de trabajos disponibles (Zona Inferior)
 */
const AvailableJobCard: React.FC<{
  addon: Addon;
  onAdd: () => void;
  imageUrl: string;
  onError: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}> = ({ addon, onAdd, imageUrl, onError }) => {
  const theme = useTheme();

  return (
    <Card
      elevation={2}
      sx={{
        height: "100%",
        transition: "all 0.3s ease",
        border: "1px solid transparent",
        "&:hover": {
          transform: "translateY(2px)",
          boxShadow: theme.shadows[6],
          borderColor: theme.palette.primary.main,
          "& .add-icon": {
            opacity: 1,
            transform: "scale(1)",
          },
        },
      }}
    >
      <CardActionArea onClick={onAdd} sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "stretch" }}>
        <Box sx={{ position: "relative", paddingTop: "65%", overflow: "hidden", bgcolor: "#fff" }}>
          <CardMedia
            component="img"
            image={imageUrl}
            alt={addon.name}
            onError={onError}
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
          {/* Overlay con icono de añadir al hover */}
          <Box
            className="add-icon"
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: "rgba(25, 118, 210, 0.2)", // Primary color tint
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0,
              transform: "scale(0.8)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": { opacity: 1 },
            }}
          >
            <Avatar sx={{ bgcolor: "primary.main", width: 48, height: 48 }}>
              <AddCircleOutlineIcon sx={{ fontSize: 30 }} />
            </Avatar>
          </Box>
        </Box>
        <CardContent sx={{ flexGrow: 1, p: 2 }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ lineHeight: 1.2 }}>
            {addon.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Click para añadir
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

/**
 * Fila de detalle de un trabajo ya aplicado (Zona Superior)
 */
const AppliedJobRow: React.FC<{
  appliedAddon: AppliedAddon;
  addonDef?: Addon; // Definición original para saber qué inputs mostrar
  imageUrl: string;
  onRemove: () => void;
  onUpdate: (field: string, val: string) => void;
  onError: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}> = ({ appliedAddon, addonDef, imageUrl, onRemove, onUpdate, onError }) => {
  if (!addonDef) return null;

  return (
    <Fade in={true}>
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 2,
          display: "flex",
          flexWrap: "wrap", // Responsive en móviles
          alignItems: "center",
          gap: 2,
          borderLeft: "4px solid #1976d2",
          backgroundColor: "#fff",
        }}
      >
        {/* 1. Miniatura */}
        <Avatar src={imageUrl} variant="rounded" sx={{ width: 64, height: 64, bgcolor: "#f0f0f0", border: "1px solid #eee" }} imgProps={{ onError }}>
          <ConstructionIcon color="action" />
        </Avatar>

        {/* 2. Información */}
        <Box sx={{ flexGrow: 1, minWidth: "200px" }}>
          <Typography variant="subtitle1" fontWeight="bold">
            {addonDef.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Configura las medidas necesarias
          </Typography>
        </Box>

        {/* Inputs Dinámicos con VALIDACIÓN */}
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
          {addonDef.requiredMeasurements.map((fieldKey) => (
            <MeasurementInput
              key={fieldKey}
              fieldKey={fieldKey}
              value={appliedAddon.measurements[fieldKey]}
              // Pasamos la función de actualización limpia
              onChange={(key, val) => onUpdate(key, val)}
            />
          ))}
        </Box>

        {/* 4. Botón Eliminar */}
        <Tooltip title="Eliminar este trabajo">
          <IconButton onClick={onRemove} color="error" size="small" sx={{ ml: 1 }}>
            <DeleteOutlineIcon />
          </IconButton>
        </Tooltip>
      </Paper>
    </Fade>
  );
};

// --- COMPONENTE PRINCIPAL ---

export const WizardStep3_JobsAndAssembly: React.FC = () => {
  const { mainPieces } = useQuoteState();
  const dispatch = useQuoteDispatch();
  const theme = useTheme();

  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [allAddons, setAllAddons] = useState<Addon[]>([]);
  const [allMaterials, setAllMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Carga de Datos
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [addonsData, materialsData] = await Promise.all([get<Addon>("/addons"), get<Material>("/materials")]);
        setAllAddons(addonsData);
        setAllMaterials(materialsData);
      } catch (error) {
        console.error("Error loading step 3 data", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // 2. Memos
  const assemblyAddons = useMemo(() => allAddons.filter((a) => a.category === "ENSAMBLAJE"), [allAddons]);
  const jobAddons = useMemo(() => allAddons.filter((a) => a.category === "TRABAJO"), [allAddons]);

  // Mapa de materiales completo (ID -> Objeto Material) para pasarlo al componente visual
  const materialMapFull = useMemo(() => {
    return allMaterials.reduce(
      (acc, mat) => {
        acc[mat._id] = mat;
        return acc;
      },
      {} as Record<string, Material>,
    );
  }, [allMaterials]);

  const materialCategoryMap = useMemo(() => {
    return allMaterials.reduce(
      (acc, mat) => {
        acc[mat._id] = mat.category;
        return acc;
      },
      {} as Record<string, string>,
    );
  }, [allMaterials]);

  // --- LOGICA DE IMÁGENES INTELIGENTE ---
  const getAddonImageUrl = (addon: Addon | undefined) => {
    if (!addon) return DEFAULT_IMAGE;

    // 1. Si tiene una URL de imagen definida en el backend (CMS), úsala.
    if (addon.imageUrl) {
      return addon.imageUrl;
    }

    // 2. Fallback a ruta local basada en código (Legacy)
    return `${IMAGE_PATH}/${addon.code}.jpg`;
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (e.currentTarget.src !== window.location.origin + DEFAULT_IMAGE) {
      e.currentTarget.src = DEFAULT_IMAGE;
    }
  };

  // --- HANDLERS ---

  // Handlers de Lógica de Negocio (Igual que antes)
  const getCurrentAssemblyForUnion = (targetPieceIndex: number) => {
    if (!mainPieces[targetPieceIndex]) return "";
    const piece = mainPieces[targetPieceIndex];
    const found = piece.appliedAddons.find((applied) => assemblyAddons.some((a) => a.code === applied.code));
    return found ? found.code : "";
  };

  const handleAssemblyChange = (unionIndex: number, addonCode: string) => {
    const targetPieceIndex = unionIndex + 1;
    const piece = mainPieces[targetPieceIndex];

    const existingAssemblyIndex = piece.appliedAddons.findIndex((applied) => assemblyAddons.some((a) => a.code === applied.code));

    if (existingAssemblyIndex !== -1) {
      dispatch({
        type: "REMOVE_ADDON_FROM_PIECE",
        payload: { pieceIndex: targetPieceIndex, addonIndex: existingAssemblyIndex },
      });
    }

    if (!addonCode) return;

    const addonDef = assemblyAddons.find((a) => a.code === addonCode);
    if (addonDef) {
      const defaultMeasurements: Record<string, number> = {};
      addonDef.requiredMeasurements.forEach((m) => (defaultMeasurements[m] = m === "quantity" ? 1 : 0));
      dispatch({ type: "ADD_ADDON_TO_PIECE", payload: { pieceIndex: targetPieceIndex, addon: { code: addonDef.code, measurements: defaultMeasurements } } });
    }
  };

  // 2. TRABAJOS (Por pieza)
  // Cambio de TAB a través del Card Selector
  const handlePieceSelect = (index: number) => {
    setActiveTabIndex(index);
    dispatch({ type: "SET_ACTIVE_PIECE", payload: { index } });
  };

  const handleAddJob = (pieceIndex: number, addon: Addon) => {
    const defaultMeasurements: Record<string, number> = {};

    // --- INICIALIZACIÓN INTELIGENTE (Validación) ---
    // Si es por metros lineales, empezamos en 1
    if (addon.requiredMeasurements.includes("length_ml")) {
      defaultMeasurements["length_ml"] = 1;
    }

    // Rellenar resto de campos
    addon.requiredMeasurements.forEach((m) => {
      if (defaultMeasurements[m] === undefined) {
        // Quantity por defecto 1, otros (dimensiones) en 0 para forzar validación
        defaultMeasurements[m] = m === "quantity" ? 1 : 0;
      }
    });
    const newAddon: AppliedAddon = { code: addon.code, measurements: defaultMeasurements };
    dispatch({ type: "ADD_ADDON_TO_PIECE", payload: { pieceIndex, addon: newAddon } });
  };

  const handleRemoveJob = (pieceIndex: number, addonIndex: number) => {
    dispatch({ type: "REMOVE_ADDON_FROM_PIECE", payload: { pieceIndex, addonIndex } });
  };

  // Esta función necesita encontrar el índice real dentro del array completo de addons de la pieza
  // OJO: piece.appliedAddons contiene TODO (ensamblajes y trabajos).
  const handleUpdateJobMeasurement = (pIdx: number, addonIndexInPiece: number, field: string, val: string) => {
    // La validación de número se hace en el onChange del input, aquí solo pasamos
    const numVal = parseFloat(val);
    const finalVal = isNaN(numVal) ? 0 : numVal;

    // Obtenemos el estado actual para hacer merge (aunque el reducer ya tiene lógica de merge inteligente,
    // es bueno enviar solo lo que cambia o el objeto completo de measurements)
    // En este caso enviamos el objeto de measurements actualizado
    const currentMeas = mainPieces[pIdx].appliedAddons[addonIndexInPiece].measurements;

    const newMeas = { ...currentMeas, [field]: finalVal };

    dispatch({
      type: "UPDATE_ADDON_IN_PIECE",
      payload: { pieceIndex: pIdx, addonIndex: addonIndexInPiece, data: { measurements: newMeas } },
    });
  };

  // --- RENDER ---

  if (isLoading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  if (mainPieces.length === 0) return <Alert severity="warning">Sin piezas definidas.</Alert>;

  const numberOfUnions = Math.max(0, mainPieces.length - 1);
  const activePiece = mainPieces[activeTabIndex];

  return (
    <Box sx={{ pb: 8 }}>
      {/* Título Principal */}
      <Box sx={{ mb: 4, display: "flex", alignItems: "center", gap: 2 }}>
        <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
          <HandymanIcon />
        </Avatar>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: "bold", color: "#333" }}>
            Trabajos y Ensamblajes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configura cómo se unen las piezas y añade recortes o encastres.
          </Typography>
        </Box>
      </Box>

      {/* =========================================================
          BLOQUE A: UNIONES (VISUAL)
         ========================================================= */}
      {numberOfUnions > 0 && (
        <Box sx={{ mb: 5 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: theme.palette.primary.main, display: "flex", alignItems: "center", gap: 1 }}>
            <LinkIcon /> Uniones entre piezas
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            {Array.from({ length: numberOfUnions }).map((_, unionIndex) => {
              const pieceAIndex = unionIndex;
              const pieceBIndex = unionIndex + 1;
              if (!mainPieces[pieceBIndex]) return null;

              const matCategoryB = materialCategoryMap[mainPieces[pieceBIndex].materialId!] || "";
              const currentVal = getCurrentAssemblyForUnion(pieceBIndex);
              const compatibleAssemblies = assemblyAddons.filter((a) => a.allowedMaterialCategories.includes(matCategoryB));

              // Helper para obtener el objeto Addon completo del valor seleccionado
              const selectedAddonObj = compatibleAssemblies.find((a) => a.code === currentVal);

              return (
                <Grid size={{ xs: 12 }} key={`union-${unionIndex}`}>
                  <Paper
                    elevation={0}
                    variant="outlined"
                    sx={{ p: 3, borderLeft: `6px solid ${theme.palette.secondary.main}`, backgroundColor: "#fafafa", borderRadius: 2 }}
                  >
                    <Grid container spacing={4} alignItems="center">
                      <Grid size={{ xs: 12, md: 7 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
                          Unión {unionIndex + 1}: Pieza {pieceAIndex + 1} ↔ Pieza {pieceBIndex + 1}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                          Selecciona el tipo de mecanizado para unir estas dos piezas.
                        </Typography>
                        <FormControl fullWidth>
                          <InputLabel id={`assembly-label-${unionIndex}`}>Tipo de Unión</InputLabel>
                          <Select
                            labelId={`assembly-label-${unionIndex}`}
                            value={currentVal}
                            label="Tipo de Unión"
                            onChange={(e) => handleAssemblyChange(unionIndex, e.target.value)}
                            renderValue={(selected) => {
                              if (!selected) return <em>Sin unión (A tope)</em>;

                              // Buscamos el objeto completo para sacar la imagen correcta
                              const addon = compatibleAssemblies.find((a) => a.code === selected);

                              return (
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 2,
                                  }}
                                >
                                  <Avatar
                                    variant="rounded"
                                    src={getAddonImageUrl(addon)} // USAMOS LA NUEVA FUNCIÓN
                                    sx={{ width: 32, height: 32 }}
                                  >
                                    <ImageNotSupportedIcon sx={{ fontSize: 16 }} />
                                  </Avatar>
                                  {selectedAddonObj?.name || selected}
                                </Box>
                              );
                            }}
                          >
                            <MenuItem value="">
                              <Box sx={{ display: "flex", alignItems: "center", gap: 2, color: "text.secondary" }}>
                                <Avatar variant="rounded" sx={{ width: 32, height: 32, bgcolor: "#eee" }}>
                                  <LinkIcon sx={{ color: "#999", fontSize: 20 }} />
                                </Avatar>
                                <em>Sin unión específica (A tope)</em>
                              </Box>
                            </MenuItem>
                            {compatibleAssemblies.map((addon) => (
                              <MenuItem key={addon._id} value={addon.code}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                  <Avatar
                                    variant="rounded"
                                    src={getAddonImageUrl(addon)} // USAMOS LA NUEVA FUNCIÓN
                                    sx={{ width: 40, height: 40 }}
                                    imgProps={{ onError: handleImageError }}
                                  >
                                    <ImageNotSupportedIcon />
                                  </Avatar>
                                  <Box>
                                    <Typography variant="body2" fontWeight="bold">
                                      {addon.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Compatible con {matCategoryB}
                                    </Typography>
                                  </Box>
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12, md: 5 }} sx={{ display: "flex", justifyContent: "center" }}>
                        <Box
                          sx={{
                            width: "100%",
                            maxWidth: 300,
                            aspectRatio: "4/3",
                            borderRadius: 3,
                            overflow: "hidden",
                            boxShadow: 3,
                            border: "1px solid #eee",
                            position: "relative",
                            bgcolor: "#fff",
                          }}
                        >
                          <img
                            src={
                              currentVal
                                ? getAddonImageUrl(selectedAddonObj) // USAMOS LA NUEVA FUNCIÓN
                                : DEFAULT_IMAGE
                            }
                            alt="Previsualización"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                            }}
                            onError={handleImageError}
                          />
                          <Chip
                            label={selectedAddonObj ? selectedAddonObj.name : "Sin Unión"}
                            color={currentVal ? "primary" : "default"}
                            size="small"
                            sx={{ position: "absolute", bottom: 10, left: 10, backdropFilter: "blur(4px)", backgroundColor: "#85b2de" }}
                          />
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      {/* =========================================================
          BLOQUE B: TRABAJOS (NUEVO UI/UX)
         ========================================================= */}
      <Box>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: theme.palette.primary.main, display: "flex", alignItems: "center", gap: 1 }}>
          <HandymanIcon /> Trabajos por pieza
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {/* 1. SELECTOR VISUAL (Reemplazo de <Tabs>) */}
        <ProjectPiecesSelector materialsMap={materialMapFull} activeIndex={activeTabIndex} onPieceSelect={handlePieceSelect} />

        {/* 2. ÁREA DE EDICIÓN DE LA PIEZA SELECCIONADA */}
        {activePiece && (
          <Fade in={true} key={activePiece.id} timeout={400}>
            <Box sx={{ mt: 2, minHeight: 300 }}>
              {(() => {
                // Lógica de filtrado de addons para la pieza activa
                const matCategory = materialCategoryMap[activePiece.materialId!] || "";
                const appliedJobsWithIndex = activePiece.appliedAddons
                  .map((addon, idx) => ({ ...addon, originalIndex: idx }))
                  .filter((addon) => jobAddons.some((def) => def.code === addon.code));

                // Filtrar trabajos disponibles para este material
                const compatibleJobs = jobAddons.filter((job) => job.allowedMaterialCategories.includes(matCategory));

                return (
                  <>
                    <Box sx={{ mb: 4 }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 1, fontWeight: "bold" }}>
                          TRABAJOS APLICADOS EN PIEZA {activeTabIndex + 1}
                        </Typography>
                      </Box>

                      {appliedJobsWithIndex.length === 0 ? (
                        <Alert severity="info" variant="outlined" sx={{ mb: 2, borderStyle: "dashed" }}>
                          No hay trabajos añadidos en esta pieza. Selecciona uno del catálogo inferior.
                        </Alert>
                      ) : (
                        appliedJobsWithIndex.map((applied) => {
                          const def = jobAddons.find((d) => d.code === applied.code);
                          return (
                            <AppliedJobRow
                              key={`${applied.code}-${applied.originalIndex}`}
                              appliedAddon={applied}
                              addonDef={def}
                              imageUrl={getAddonImageUrl(def)} // USAMOS LA NUEVA FUNCIÓN
                              onError={handleImageError}
                              onRemove={() => handleRemoveJob(activeTabIndex, applied.originalIndex)}
                              onUpdate={(field, val) => handleUpdateJobMeasurement(activeTabIndex, applied.originalIndex, field, val)}
                            />
                          );
                        })
                      )}
                    </Box>

                    <Divider sx={{ my: 4 }}>
                      <Chip label="Catálogo de Trabajos Disponibles" />
                    </Divider>

                    {/* 2. CATÁLOGO (ZONA INFERIOR - GRID) */}
                    <Grid container spacing={2}>
                      {compatibleJobs.map((job) => (
                        <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2 }} key={job._id}>
                          <AvailableJobCard
                            addon={job}
                            imageUrl={getAddonImageUrl(job)}
                            onError={handleImageError}
                            onAdd={() => handleAddJob(activeTabIndex, job)}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </>
                );
              })()}
            </Box>
          </Fade>
        )}
      </Box>
    </Box>
  );
};
