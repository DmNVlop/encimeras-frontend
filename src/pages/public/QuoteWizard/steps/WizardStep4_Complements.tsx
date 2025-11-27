import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Paper,
  Grid,
  Avatar,
  useTheme,
  Chip,
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
  IconButton,
  TextField,
  Tooltip,
  Divider,
  Fade,
} from "@mui/material";
import ExtensionIcon from "@mui/icons-material/Extension";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

// --- IMPORTACIONES ---
// Usamos rutas relativas asumiendo que este archivo está en src/pages/wizard/steps/
import { useQuoteDispatch, useQuoteState, type AppliedAddon } from "../../../../context/QuoteContext";
import { get } from "../../../../services/apiService";
import type { Material } from "../../../../interfases/materials.interfase";
import type { Addon } from "../../../../interfases/addon.interfase";

// --- CONSTANTES VISUALES ---
// Asegúrate de tener esta imagen en tu carpeta public/images/addons/
const IMAGE_PATH = "/addons";
const DEFAULT_IMAGE = `${IMAGE_PATH}/default_assembly.jpg`;

// --- SUB-COMPONENTES INTERNOS ---

/**
 * Tarjeta del catálogo de complementos disponibles (Zona Inferior)
 */
const AvailableComplementCard: React.FC<{
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
          transform: "translateY(-4px)",
          boxShadow: theme.shadows[6],
          borderColor: theme.palette.secondary.main, // Usamos secondary para diferenciar del paso 3
          "& .add-icon": { opacity: 1, transform: "scale(1)" },
        },
      }}
    >
      <CardActionArea
        onClick={onAdd}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
        }}
      >
        <Box
          sx={{
            position: "relative",
            paddingTop: "65%",
            overflow: "hidden",
            bgcolor: "#fff",
          }}
        >
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
          {/* Overlay Hover */}
          <Box
            className="add-icon"
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: "rgba(156, 39, 176, 0.2)", // Tinte morado (Secondary)
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0,
              transform: "scale(0.8)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <Avatar sx={{ bgcolor: "secondary.main", width: 48, height: 48 }}>
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
 * Fila de detalle de un complemento ya aplicado (Zona Superior)
 */
const AppliedComplementRow: React.FC<{
  appliedAddon: AppliedAddon;
  addonDef?: Addon;
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
          flexWrap: "wrap",
          alignItems: "center",
          gap: 2,
          borderLeft: "4px solid #9c27b0", // Morado para consistencia visual
          backgroundColor: "#fff",
        }}
      >
        {/* 1. Miniatura */}
        <Avatar
          src={imageUrl}
          variant="rounded"
          sx={{
            width: 64,
            height: 64,
            bgcolor: "#f0f0f0",
            border: "1px solid #eee",
          }}
          imgProps={{ onError }}
        >
          <ExtensionIcon color="action" />
        </Avatar>

        {/* 2. Información */}
        <Box sx={{ flexGrow: 1, minWidth: "200px" }}>
          <Typography variant="subtitle1" fontWeight="bold">
            {addonDef.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Ajusta cantidad o medidas
          </Typography>
        </Box>

        {/* 3. Inputs Dinámicos */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {addonDef.requiredMeasurements.map((field) => {
            // 1. Configuración Lógica del Input
            let minVal = 0;
            let stepVal = "1";

            if (field === "length_ml") {
              minVal = 1;
              stepVal = "0.1";
            } else if (field === "quantity") {
              minVal = 1;
              stepVal = "1";
            }

            // 2. VALIDACIÓN VISUAL (Estado de Error)
            const currentValue = appliedAddon.measurements[field];
            const numValue = parseFloat(currentValue?.toString() || "0");

            // Es inválido si es vacío, NaN, o menor/igual a 0 (para quantity/length)
            // O simplemente <= 0 para dimensiones físicas en este negocio
            const isInvalid = !currentValue || isNaN(numValue) || numValue <= 0;

            return (
              <TextField
                key={field}
                label={field === "quantity" ? "Cantidad" : field.replace("_mm", " (mm)").replace("_ml", " (ml)").toUpperCase()}
                type="number"
                size="small"
                variant="outlined"
                value={currentValue || ""}
                onChange={(e) => {
                  // const val = parseFloat(e.target.value);
                  // Permitimos escribir (incluso si es inválido momentáneamente) para no bloquear al usuario
                  // La validación visual le dirá que lo corrija
                  onUpdate(field, e.target.value);
                }}
                // --- FEEDBACK VISUAL ---
                error={isInvalid}
                helperText={isInvalid ? "Requerido" : ""}
                // --- PROPIEDADES HTML5 (slotProps en vez de InputProps) ---
                slotProps={{
                  input: {
                    inputProps: { min: minVal, step: stepVal },
                  },
                }}
                sx={{ width: field === "quantity" ? 90 : 120 }}
              />
            );
          })}
        </Box>

        {/* 4. Botón Eliminar */}
        <Tooltip title="Quitar complemento">
          <IconButton onClick={onRemove} color="error" size="small" sx={{ ml: 1 }}>
            <DeleteOutlineIcon />
          </IconButton>
        </Tooltip>
      </Paper>
    </Fade>
  );
};

// --- COMPONENTE PRINCIPAL ---

export const WizardStep4_Complements: React.FC = () => {
  const theme = useTheme();
  const { mainPieces } = useQuoteState();
  const dispatch = useQuoteDispatch();

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
        console.error("Error loading step 4 data", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // 2. Memos
  const complementAddons = useMemo(() => allAddons.filter((a) => a.category === "COMPLEMENTO"), [allAddons]);

  const materialMap = useMemo(() => {
    return allMaterials.reduce(
      (acc, mat) => {
        acc[mat._id] = mat.category;
        return acc;
      },
      {} as Record<string, string>,
    );
  }, [allMaterials]);

  // --- HANDLERS ---

  const handleTabChange = (_e: React.SyntheticEvent, newValue: number) => {
    setActiveTabIndex(newValue);
    dispatch({ type: "SET_ACTIVE_PIECE", payload: { index: newValue } });
  };

  // Lógica inteligente: Sugerir medidas
  const handleAddAddon = (pieceIndex: number, addon: Addon) => {
    const piece = mainPieces[pieceIndex];
    const defaultMeasurements: Record<string, number> = {};

    // Si pide 'length_ml', sugerimos el largo de la pieza (convertido a metros)
    if (addon.requiredMeasurements.includes("length_ml")) {
      defaultMeasurements["length_ml"] = piece.measurements.length_mm / 1000;
    }

    // Rellenar resto de campos obligatorios con 0 o 1
    addon.requiredMeasurements.forEach((m) => {
      if (defaultMeasurements[m] === undefined) {
        defaultMeasurements[m] = m === "quantity" ? 1 : 0;
      }
    });

    const newAddon: AppliedAddon = {
      code: addon.code,
      measurements: defaultMeasurements,
    };

    dispatch({
      type: "ADD_ADDON_TO_PIECE",
      payload: { pieceIndex, addon: newAddon },
    });
  };

  const handleRemoveAddon = (pieceIndex: number, addonIndex: number) => {
    dispatch({
      type: "REMOVE_ADDON_FROM_PIECE",
      payload: { pieceIndex, addonIndex },
    });
  };

  const handleUpdateMeasurement = (pieceIndex: number, addonIndexInPiece: number, field: string, val: string) => {
    const numVal = parseFloat(val);
    const finalVal = isNaN(numVal) ? 0 : numVal;

    // Merge measurements
    const currentMeas = mainPieces[pieceIndex].appliedAddons[addonIndexInPiece].measurements;
    const newMeas = { ...currentMeas, [field]: finalVal };

    dispatch({
      type: "UPDATE_ADDON_IN_PIECE",
      payload: {
        pieceIndex,
        addonIndex: addonIndexInPiece,
        data: { measurements: newMeas },
      },
    });
  };

  // --- UTILIDADES DE IMAGEN ---
  const getImageUrl = (addon: Addon | undefined) => {
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

  // --- RENDER ---

  if (isLoading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  if (mainPieces.length === 0) return <Alert severity="warning">Define la forma primero.</Alert>;

  return (
    <Box sx={{ pb: 4 }}>
      {/* TÍTULO DEL PASO */}
      <Box sx={{ mb: 4, display: "flex", alignItems: "center", gap: 2 }}>
        <Avatar sx={{ bgcolor: theme.palette.secondary.main }}>
          <ExtensionIcon />
        </Avatar>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: "bold", color: "#333" }}>
            Complementos y Accesorios
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Añade copetes, costados vistos, tiras u otros extras a cada pieza.
          </Typography>
        </Box>
      </Box>

      {/* TABS DE PIEZAS */}
      <Tabs
        value={activeTabIndex}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}
        indicatorColor="secondary"
        textColor="secondary"
      >
        {mainPieces.map((p, idx) => (
          <Tab label={`Pieza ${idx + 1}`} key={p.id} />
        ))}
      </Tabs>

      {/* CONTENIDO POR PIEZA */}
      <Box sx={{ mt: 2 }}>
        {mainPieces.map((piece, index) => {
          if (activeTabIndex !== index) return null;
          const matCategory = materialMap[piece.materialId!] || "";

          // 1. Filtrar addons APLICADOS que sean complementos
          const appliedComplements = piece.appliedAddons
            .map((addon, idx) => ({ ...addon, originalIndex: idx }))
            .filter((addon) => complementAddons.some((def) => def.code === addon.code));

          // 2. Filtrar addons DISPONIBLES (Catálogo)
          const compatibleComplements = complementAddons.filter((c) => c.allowedMaterialCategories.includes(matCategory));

          return (
            <Box key={piece.id} role="tabpanel" sx={{ minHeight: 300, py: 2 }}>
              {/* ZONA SUPERIOR: Complementos Seleccionados */}
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{
                    mb: 2,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    fontWeight: "bold",
                  }}
                >
                  Complementos añadidos a la Pieza {index + 1}
                </Typography>
                {}
                {appliedComplements.length === 0 ? (
                  <Alert severity="info" variant="outlined" sx={{ mb: 2, borderStyle: "dashed" }}>
                    No hay complementos en esta pieza.
                  </Alert>
                ) : (
                  appliedComplements.map((applied) => {
                    const def = complementAddons.find((d) => d.code === applied.code);
                    return (
                      <AppliedComplementRow
                        key={`${applied.code}-${applied.originalIndex}`}
                        appliedAddon={applied}
                        addonDef={def}
                        imageUrl={getImageUrl(def)}
                        onError={handleImageError}
                        onRemove={() => handleRemoveAddon(index, applied.originalIndex)}
                        onUpdate={(field, val) => handleUpdateMeasurement(index, applied.originalIndex, field, val)}
                      />
                    );
                  })
                )}
              </Box>

              <Divider sx={{ my: 4 }}>
                <Chip label="Catálogo de Complementos" color="secondary" variant="outlined" icon={<ExtensionIcon />} />
              </Divider>

              {/* ZONA INFERIOR: Catálogo Grid */}
              <Grid container spacing={2}>
                {compatibleComplements.map((addon) => (
                  <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2 }} key={addon._id}>
                    <AvailableComplementCard
                      addon={addon}
                      imageUrl={getImageUrl(addon)}
                      onError={handleImageError}
                      onAdd={() => handleAddAddon(index, addon)}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
