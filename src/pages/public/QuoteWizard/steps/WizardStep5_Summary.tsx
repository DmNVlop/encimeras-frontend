import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  IconButton,
  DialogContent,
  useTheme,
  Avatar,
  Snackbar,
  Alert,
  Chip,
} from "@mui/material";
import { validateAssemblies } from "@/utils/quoteValidation";
import Grid from "@mui/material/Grid";
import SendIcon from "@mui/icons-material/Send";
import CalculateIcon from "@mui/icons-material/Calculate";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import AssignmentIcon from "@mui/icons-material/Assignment";
import SummarizeIcon from "@mui/icons-material/Summarize";
import StraightenIcon from "@mui/icons-material/Straighten";
import { shapeVariations } from "@/pages/public/common/shapes-step2";
import EncimeraPreview from "@/pages/public/common/EncimeraPreview/encimera-preview";

// 1. Importar Contexto
import { useQuoteState, useQuoteDispatch } from "@/context/QuoteContext";
import { post } from "@/services/api.service"; // Asumimos que tienes un método 'post' genérico
import type { CalculationResponse } from "@/interfases/price.interfase";
import { ApiErrorFeedback } from "@/pages/public/common/ApiErrorFeedback";
import { draftsApi } from "@/services/drafts.service";
// import { Countertop3DViewer } from "../../common/Countertop3DViewer";

// =============================================================================
// COMPONENTE WizardStep5_Summary
// =============================================================================

export const WizardStep5_Summary: React.FC = () => {
  const theme = useTheme();

  const { mainPieces, selectedShapeId, isCalculating, calculationResult, error, currentDraftId, wizardTempMaterial } = useQuoteState();
  const dispatch = useQuoteDispatch();

  // Estado local para el envío final
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // --- ESTADOS PARA BORRADORES ---
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ESTADO PARA EL MODAL 3D
  const [open3D, setOpen3D] = useState(false);

  // ===========================================================================
  // 🛠️ HELPER: Transformar datos del Contexto (Anidados) a API (Planos)
  // ===========================================================================
  const mapStateToApiPayload = (pieces: typeof mainPieces) => {
    return {
      mainPieces: pieces.map((piece) => ({
        // Copiamos IDs y atributos
        id: piece.id,
        materialId: piece.materialId,
        selectedAttributes: piece.selectedAttributes,

        // 🔥 CORRECCIÓN CRÍTICA: Aplanamos las medidas
        length_mm: piece.measurements.length_mm,
        width_mm: piece.measurements.width_mm,

        // Mapeamos los addons asegurando que usamos 'code'
        appliedAddons: piece.appliedAddons.map((addon) => ({
          code: addon.code,
          measurements: addon.measurements,
          quantity: addon.measurements.quantity || 1,
        })),
      })),
    };
  };

  // ---------------------------------------------------------------------------
  // HANDLER: CALCULAR PRECIO (POST /quotes/calculate)
  // ---------------------------------------------------------------------------
  const handleCalculate = async () => {
    dispatch({ type: "CALCULATION_START" });

    if (mainPieces.length === 0) {
      dispatch({ type: "CALCULATION_ERROR", payload: { error: "No hay piezas definidas." } });
      return;
    }

    // --- VALIDACIÓN DE UNIONES ---
    const assemblyValidation = validateAssemblies(mainPieces);
    if (!assemblyValidation.isValid) {
      dispatch({
        type: "CALCULATION_ERROR",
        payload: { error: assemblyValidation.error || "Faltan uniones por seleccionar. Revisa el paso 3." },
      });
      return;
    }

    try {
      // Usamos el helper para generar el payload
      const payload = mapStateToApiPayload(mainPieces);

      // Usamos 'post' en lugar de 'create' para ser semánticamente correctos
      const response = await post<CalculationResponse>("/quotes/calculate", payload);

      dispatch({
        type: "CALCULATION_SUCCESS",
        payload: { results: response },
      });
    } catch (err: any) {
      console.error("Calculation Error:", err);
      // const errorMsg = err.response?.data?.message || "Error al conectar con el servidor de cálculo.";
      dispatch({ type: "CALCULATION_ERROR", payload: { error: err } });
    }
  };

  // ---------------------------------------------------------------------------
  // HANDLER: ENVIAR PEDIDO (POST /quotes)
  // ---------------------------------------------------------------------------
  const handleFinalSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitSuccess(false);

    const formData = new FormData(event.currentTarget);
    const customerEmail = formData.get("email") as string;
    // const customerName = formData.get("name") as string;

    try {
      setSubmitError(null);
      // PASO 1: Garantizar que existe un Borrador actualizado
      let activeDraftId = currentDraftId;

      // Payload actual del contexto
      const currentPayload = {
        configuration: { wizardTempMaterial, mainPieces, selectedShapeId },
        currentPricePoints: calculationResult?.totalPoints || 0,
      };

      if (activeDraftId) {
        // A) Si YA existe: Lo actualizamos silenciosamente para asegurar que
        // lo que se convierte en orden es EXACTAMENTE lo que hay en pantalla.
        await draftsApi.update(activeDraftId, currentPayload);
      } else {
        // B) Si NO existe: Lo creamos en segundo plano
        const draftRes = await draftsApi.create(currentPayload);
        activeDraftId = draftRes.data.id;
        // Importante: Actualizamos el contexto por si el usuario se queda aquí
        dispatch({ type: "SET_DRAFT_ID", payload: activeDraftId });
      }

      // PASO 2: Convertir ese Borrador en Orden Oficial
      // El backend leerá el borrador (activeDraftId), creará el Snapshot y lo "quemará" (isConverted: true)
      const orderRes = await draftsApi.convertToOrder({
        draftId: activeDraftId,
        customerId: customerEmail, // O el ID que prefieras usar
        // deliveryInfo: { ... } // Si añades dirección en el futuro
      });

      console.log("Orden Creada:", orderRes.data.orderNumber);
      setSubmitSuccess(true);

      // Opcional: Aquí podrías limpiar el contexto o redirigir
      // dispatch({ type: "RESET_WIZARD" });
    } catch (err: any) {
      console.error("Submit Error:", err);
      const errorMessage = err.response?.data?.message || "Hubo un error al procesar tu pedido. Por favor, intenta de nuevo.";
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // HANDLER: GUARDAR/ACTUALIZAR BORRADOR
  // ---------------------------------------------------------------------------
  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    setSaveMessage(null);

    const payload = {
      configuration: {
        wizardTempMaterial: wizardTempMaterial,
        mainPieces: mainPieces,
        selectedShapeId: selectedShapeId,
      },
      currentPricePoints: calculationResult?.totalPoints || 0,
    };

    try {
      if (currentDraftId) {
        // ACTUALIZAR EXISTENTE (PUT)
        await draftsApi.update(currentDraftId, payload);
        setSaveMessage({ type: "success", text: "Presupuesto actualizado." });
      } else {
        // CREAR NUEVO (POST)
        const response = await draftsApi.create(payload);
        const newId = response.data.id;

        dispatch({ type: "SET_DRAFT_ID", payload: newId });

        // Actualizamos URL para permitir F5
        const newUrl = `${window.location.pathname}?draftId=${newId}`;
        window.history.replaceState({ path: newUrl }, "", newUrl);

        setSaveMessage({ type: "success", text: "Borrador guardado correctamente." });
      }
    } catch (err) {
      console.error("Save Draft Error:", err);
      setSaveMessage({ type: "error", text: "No se pudo guardar el borrador." });
    } finally {
      setIsSavingDraft(false);
    }
  };

  // ---------------------------------------------------------------------------
  // HANDLER: RENDERIZADO DEL DESGLOSE (Visualización de CalculationResponse)
  // ---------------------------------------------------------------------------
  // ---------------------------------------------------------------------------
  // HANDLER: RENDERIZADO DEL DESGLOSE (Visualización de CalculationResponse)
  // ---------------------------------------------------------------------------
  const renderBreakdown = () => {
    if (!calculationResult) return null;

    // 1. Verificación reforzada
    if (!calculationResult || !calculationResult.pieces) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          Pulsa "Calcular Presupuesto" para ver el desglose detallado.
        </Alert>
      );
    }

    const result = calculationResult as CalculationResponse;

    return (
      <Box sx={{ mt: 4, pb: 4 }}>
        {/* --- TÍTULO DEL PASO --- */}
        <Box sx={{ mb: 4, display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
            <AssignmentIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: "bold", color: "#333" }}>
              Desglose del Proyecto
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Detalle precio por piezas y servicios adicionales.
            </Typography>
          </Box>
        </Box>

        {/* --- PROYECTO GLOBAL SUMMARY --- */}
        <Paper
          elevation={0}
          sx={{
            mb: 4,
            p: 2.5,
            borderRadius: 3,
            bgcolor: (theme) => (theme.palette.mode === "dark" ? "rgba(25, 118, 210, 0.08)" : "rgba(25, 118, 210, 0.04)"),
            border: "1px dashed",
            borderColor: "primary.light",
          }}
        >
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: "bold", textTransform: "uppercase", display: "block", mb: 0.5 }}>
                Material Principal
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Avatar src={wizardTempMaterial?.materialImage} sx={{ width: 24, height: 24 }} />
                <Typography variant="body1" fontWeight="800">
                  {wizardTempMaterial?.materialName}
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: "bold", textTransform: "uppercase", display: "block", mb: 0.5 }}>
                Forma de Encimera
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                {selectedShapeId && (
                  <Box
                    sx={{
                      width: 50,
                      height: 30,
                      bgcolor: "background.paper",
                      borderRadius: 1,
                      border: "1px solid #e0e0e0",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      "& .encimera-preview-container": {
                        minHeight: "unset",
                        height: "100%",
                        width: "100%",
                        p: 0.5,
                      },
                      "& .encimera-pieza": {
                        backgroundSize: "8px 8px",
                      },
                    }}
                  >
                    <EncimeraPreview
                      config={{
                        id: selectedShapeId,
                        name: shapeVariations.find((s) => s.id === selectedShapeId)?.name || "",
                        grid: shapeVariations.find((s) => s.id === selectedShapeId)?.grid || { columns: "", rows: "" },
                        pieces: shapeVariations.find((s) => s.id === selectedShapeId)?.pieces || [],
                      }}
                    />
                  </Box>
                )}
                <Typography variant="body1" fontWeight="800">
                  {shapeVariations.find((s) => s.id === selectedShapeId)?.name || "Configuración Personalizada"}
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: "bold", textTransform: "uppercase", display: "block", mb: 0.5 }}>
                Número de Piezas
              </Typography>
              <Typography variant="body1" fontWeight="800">
                {mainPieces.length} {mainPieces.length === 1 ? "Pieza" : "Piezas"}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {result.pieces.map((piece, idx) => (
            <Paper
              key={idx}
              elevation={2}
              sx={{
                overflow: "hidden",
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  boxShadow: 6,
                  borderColor: "primary.light",
                },
              }}
            >
              {/* Cabecera de la Pieza */}
              <Box
                sx={{
                  bgcolor: (params) => (params.palette.mode === "dark" ? "grey.800" : "grey.50"),
                  p: 2,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="subtitle1" fontWeight="bold">
                  {piece.pieceName}
                </Typography>
                <Typography variant="h6" color="primary.main" fontWeight="bold">
                  {piece.subtotalPoints.toFixed(2)} Pts
                </Typography>
              </Box>

              {/* Detalles de la Pieza */}
              <Box sx={{ p: 2 }}>
                {/* Material Base (DESCRIPTIVO Y VISUAL) */}
                <Box
                  sx={{
                    display: "flex",
                    gap: 3,
                    alignItems: "center",
                    mb: 2,
                    p: 2.5,
                    bgcolor: (theme) => (theme.palette.mode === "dark" ? "rgba(255,255,255,0.03)" : "grey.50"),
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "divider",
                    position: "relative",
                    overflow: "hidden",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: "4px",
                      bgcolor: "primary.main",
                    },
                  }}
                >
                  {/* Imagen del Material */}
                  <Avatar
                    src={wizardTempMaterial?.materialImage}
                    alt={wizardTempMaterial?.materialName}
                    variant="rounded"
                    sx={{
                      width: 90,
                      height: 90,
                      border: "2px solid #fff",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      backgroundColor: "#fff",
                    }}
                  />

                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: "800", color: "primary.main", textTransform: "uppercase", letterSpacing: 1.5, display: "block", mb: 0.5 }}
                        >
                          Material Base (Encimera)
                        </Typography>
                        <Typography variant="h6" sx={{ fontSize: "1.1rem", fontWeight: "bold", color: "text.primary", lineHeight: 1.2 }}>
                          {wizardTempMaterial?.materialName || "Material Seleccionado"}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: "right" }}>
                        <Typography variant="h6" fontWeight="800" color="primary.main">
                          {piece.basePricePoints.toFixed(2)}
                          <Typography component="span" variant="caption" sx={{ ml: 0.5, fontWeight: "bold" }}>
                            Pts
                          </Typography>
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 1.5, opacity: 0.6 }} />

                    <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
                      {/* Medidas con Icono */}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          px: 1.2,
                          py: 0.4,
                          bgcolor: "background.paper",
                          borderRadius: 1.5,
                          border: "1px solid #e0e0e0",
                        }}
                      >
                        <StraightenIcon sx={{ fontSize: "0.9rem", color: "text.secondary" }} />
                        <Typography variant="body2" fontWeight="600" sx={{ fontSize: "0.85rem" }}>
                          {mainPieces[idx]?.measurements.length_mm} x {mainPieces[idx]?.measurements.width_mm} mm
                        </Typography>
                      </Box>

                      {/* Atributos como Chips Premium */}
                      {Object.entries(mainPieces[idx]?.selectedAttributes || {}).map(([key, value]) => (
                        <Chip
                          key={key}
                          label={value}
                          size="small"
                          sx={{
                            borderRadius: 1.5,
                            bgcolor: "rgba(0,0,0,0.04)",
                            fontWeight: "500",
                            fontSize: "0.75rem",
                            height: 24,
                            "& .MuiChip-label": { px: 1.5 },
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Box>

                {piece.addons.length > 0 && <Divider sx={{ my: 1.5 }} />}

                {/* Addons List */}
                {piece.addons.map((addon, aIdx) => (
                  <Box
                    key={aIdx}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1.5,
                      "&:last-child": { mb: 0 },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      {/* Imagen del Addon si existe */}
                      {addon.imageUrl ? (
                        <Avatar
                          src={addon.imageUrl}
                          alt={addon.name || addon.addonName}
                          variant="rounded"
                          sx={{ width: 40, height: 40, border: "1px solid #eee" }}
                        />
                      ) : (
                        <Avatar variant="rounded" sx={{ width: 40, height: 40, bgcolor: "grey.200", color: "grey.500", fontSize: "0.75rem" }}>
                          IMG
                        </Avatar>
                      )}

                      <Box>
                        <Typography variant="body2" fontWeight="bold" sx={{ color: "#333" }}>
                          {addon.name || addon.addonName}
                        </Typography>
                        {/* Si tenemos el nombre amigable, mostramos el código abajo como secundario, si no, nada */}
                        {addon.name && addon.name !== addon.addonName && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            REF: {addon.addonName}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    <Typography variant="body2" fontWeight="bold">
                      {addon.pricePoints > 0 ? `+ ${addon.pricePoints.toFixed(2)} Pts` : "Incluido"}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          ))}

          {/* TOTAL FINAL */}
          <Paper
            elevation={4}
            sx={{
              p: 3,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              borderRadius: 3,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mt: 2,
            }}
          >
            <Box>
              <Typography variant="h5" fontWeight="bold">
                TOTAL PUNTOS
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Presupuesto calculado
              </Typography>
            </Box>
            <Typography variant="h3" fontWeight="bold">
              {result.totalPoints.toFixed(2)}
            </Typography>
          </Paper>
        </Box>
      </Box>
    );
  };

  // ---------------------------------------------------------------------------
  // HANDLER: REINICIAMOS EL PRESUPUESTADOR
  // ---------------------------------------------------------------------------
  const handleStartNew = () => {
    // 1. Obtenemos la ruta base sin parámetros (ej. "/presupuestador" en lugar de "/presupuestador?draftId=xyz")
    const basePath = window.location.pathname;

    // 2. Forzamos una navegación nativa del navegador.
    // Esto hace dos cosas:
    // a) Elimina el query param ?draftId=...
    // b) Provoca un refresco real (Hard Reload), lo que limpia la memoria RAM,
    //    el Contexto de React y el contexto WebGL de BabylonJS.
    window.location.href = basePath;
  };

  // ---------------------------------------------------------------------------
  // RENDER PRINCIPAL
  // ---------------------------------------------------------------------------
  if (submitSuccess) {
    return (
      <Paper elevation={3} sx={{ p: 5, textAlign: "center", mt: 4 }}>
        <Typography variant="h4" color="success.main" gutterBottom>
          ¡Gracias!
        </Typography>
        <Typography>Tu solicitud de presupuesto ha sido enviada correctamente.</Typography>
        <Button variant="outlined" sx={{ mt: 3 }} onClick={handleStartNew}>
          Iniciar nuevo presupuesto
        </Button>
      </Paper>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      {/* --- TÍTULO DEL PASO --- */}
      <Box sx={{ mb: 4, display: "flex", alignItems: "center", gap: 2 }}>
        <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
          <SummarizeIcon />
        </Avatar>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: "bold", color: "#333" }}>
            Resumen y Envío
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Detalles del proyecto y envio de solicitud de orden.
          </Typography>
        </Box>
      </Box>

      {/* BOTÓN DE CALCULAR */}
      <Paper elevation={1} sx={{ p: 3, textAlign: "center", mb: 4, backgroundColor: "#fff" }}>
        <Typography variant="body1" paragraph>
          Pulsa el botón para procesar tu configuración y obtener el valor en Puntos.
        </Typography>

        {/* GRUPO DE BOTONES DE ACCIÓN */}
        <Box sx={{ display: "flex", justifyContent: "center", gap: 2, flexWrap: "wrap" }}>
          {/* BOTÓN 3D (NUEVO) */}
          {/* <Button
            variant="outlined"
            color="secondary"
            size="large"
            startIcon={<ViewInArIcon />}
            onClick={() => setOpen3D(true)}
            disabled={mainPieces.length === 0}
            sx={{ py: 1.5, minWidth: 180 }}
          >
            Ver en 3D
          </Button> */}

          {/* BOTÓN GUARDAR BORRADOR */}
          <Button
            variant="outlined"
            color="primary"
            size="large"
            startIcon={isSavingDraft ? <CircularProgress size={20} /> : <SaveIcon />}
            onClick={handleSaveDraft}
            disabled={isSavingDraft || mainPieces.length === 0}
            sx={{ py: 1.5, minWidth: 200 }}
          >
            {isSavingDraft ? "Guardando..." : currentDraftId ? "Actualizar Borrador" : "Guardar Borrador"}
          </Button>

          {/* BOTÓN CALCULAR (EXISTENTE) */}
          <Box sx={{ position: "relative" }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<CalculateIcon />}
              onClick={handleCalculate}
              disabled={isCalculating || mainPieces.length === 0}
              sx={{ py: 1.5, minWidth: 220 }}
            >
              {isCalculating ? "Calculando..." : "Calcular Presupuesto"}
            </Button>
            {isCalculating && <CircularProgress size={24} sx={{ position: "absolute", top: "50%", left: "50%", marginTop: "-12px", marginLeft: "-12px" }} />}
          </Box>
        </Box>

        {/* Snackbar para el feedback de guardado */}
        <Snackbar open={!!saveMessage} autoHideDuration={4000} onClose={() => setSaveMessage(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
          <Alert severity={saveMessage?.type || "info"} variant="filled">
            {saveMessage?.text}
          </Alert>
        </Snackbar>

        {error && <ApiErrorFeedback error={error} title="No se pudo calcular el presupuesto" onRetry={handleCalculate} />}
      </Paper>

      {/* DESGLOSE (Solo visible tras calcular) */}
      {calculationResult && (
        <>
          {renderBreakdown()}

          <Box sx={{ mt: 5 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
              Datos de Contacto
            </Typography>
          </Box>
          {/* FORMULARIO DE CONTACTO */}
          <Box sx={{ mt: 5 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
              Datos de Cliente
            </Typography>
            <Paper component="form" onSubmit={handleFinalSubmit} elevation={3} sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <TextField required fullWidth name="name" label="Nombre Completo" placeholder="Ej: Juan Pérez" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField required fullWidth name="email" label="Correo Electrónico" type="email" placeholder="juan@ejemplo.com" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth name="phone" label="Teléfono (Opcional)" />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  {submitError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {submitError}
                    </Alert>
                  )}
                  <Button
                    type="submit"
                    variant="contained"
                    color="success"
                    size="large"
                    fullWidth
                    startIcon={<SendIcon />}
                    disabled={isSubmitting}
                    sx={{ mt: 1, py: 1.5, fontSize: "1.1rem" }}
                  >
                    {isSubmitting ? "Enviando..." : "Confirmar y Enviar Solicitud"}
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        </>
      )}

      {/* --- MODAL DEL VISOR 3D --- */}
      <Dialog
        open={open3D}
        onClose={() => setOpen3D(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: "80vh" }, // Hacemos el modal bien alto
        }}
      >
        <DialogTitle sx={{ m: 0, p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6">Previsualización 3D</Typography>
          <IconButton aria-label="close" onClick={() => setOpen3D(false)} sx={{ color: (theme) => theme.palette.grey[500] }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, overflow: "hidden" }}>
          {/* Cargamos el visor solo si el modal está abierto para ahorrar recursos */}
          {/* open3D && (
             <Countertop3DViewer
               mainPieces={mainPieces}
               // Pasamos la imagen del material seleccionado en el paso 1
               materialImage={(wizardTempMaterial as any)?.materialImage} // Asegúrate que tu type tenga imageUrl o usa 'any' temporalmente
             />
           )
          */}
        </DialogContent>
      </Dialog>
    </Box>
  );
};
