import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  IconButton,
  DialogContent,
  useTheme,
  Avatar,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import SendIcon from "@mui/icons-material/Send";
import CalculateIcon from "@mui/icons-material/Calculate";
import CloseIcon from "@mui/icons-material/Close";
import AssignmentIcon from "@mui/icons-material/Assignment";
import SummarizeIcon from "@mui/icons-material/Summarize";

// 1. Importar Contexto
import { useQuoteState, useQuoteDispatch } from "../../../../context/QuoteContext";
import { post } from "../../../../services/apiService"; // Asumimos que tienes un método 'post' genérico
import type { CalculationResponse } from "../../../../interfases/price.interfase";
import { ApiErrorFeedback } from "../../common/ApiErrorFeedback";
import { Countertop3DViewer } from "../../common/Countertop3DViewer";

// =============================================================================
// COMPONENTE WizardStep5_Summary
// =============================================================================

export const WizardStep5_Summary: React.FC = () => {
  const theme = useTheme();

  const { mainPieces, wizardTempMaterial, isCalculating, calculationResult, error } = useQuoteState();
  const dispatch = useQuoteDispatch();

  // Estado local para el envío final
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

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
  // 1. HANDLER: CALCULAR PRECIO (POST /quotes/calculate)
  // ---------------------------------------------------------------------------
  const handleCalculate = async () => {
    dispatch({ type: "CALCULATION_START" });

    if (mainPieces.length === 0) {
      dispatch({ type: "CALCULATION_ERROR", payload: { error: "No hay piezas definidas." } });
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
      const errorMsg = err.response?.data?.message || "Error al conectar con el servidor de cálculo.";
      dispatch({ type: "CALCULATION_ERROR", payload: { error: errorMsg } });
    }
  };

  // ---------------------------------------------------------------------------
  // 2. HANDLER: ENVIAR PEDIDO (POST /quotes)
  // ---------------------------------------------------------------------------
  const handleFinalSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    // Construimos el CreateQuoteDto exacto que espera el Backend
    const finalPayload = {
      // Datos del Cliente
      customerName: formData.get("name") as string,
      customerEmail: formData.get("email") as string,
      customerPhone: formData.get("phone") as string,

      // Datos del Proyecto (El backend recalculará el precio por seguridad)
      mainPieces: mainPieces,
    };

    try {
      await post("/quotes", finalPayload);
      setSubmitSuccess(true);
      alert("¡Presupuesto enviado con éxito! Te hemos enviado un email.");
      // Aquí podrías redirigir o resetear el wizard
    } catch (err: any) {
      console.error("Submit Error:", err);
      alert("Error al enviar el presupuesto. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 3. RENDERIZADO DEL DESGLOSE (Visualización de CalculationResponse)
  // ---------------------------------------------------------------------------
  const renderBreakdown = () => {
    if (!calculationResult) return null;

    // Casta forzado seguro gracias a la interfaz
    const result = calculationResult as CalculationResponse;

    return (
      <Box sx={{ mt: 4, pb: 4 }}>
        {/* <Typography variant="h6" gutterBottom sx={{ color: "primary.main", fontWeight: "bold" }}>
          Desglose del Proyecto
        </Typography> */}

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
              Descripción de todo lo seleccionado durante el proceso.
            </Typography>
          </Box>
        </Box>

        <Paper elevation={3} sx={{ overflow: "hidden" }}>
          <List disablePadding>
            {result.pieces.map((piece, idx) => (
              <React.Fragment key={idx}>
                {/* Cabecera de la Pieza */}
                <ListItem sx={{ backgroundColor: "#f5f5f5", borderBottom: "1px solid #e0e0e0" }}>
                  <ListItemText primary={piece.pieceName} primaryTypographyProps={{ fontWeight: "bold" }} />
                  <Typography variant="body2" fontWeight="bold">
                    {piece.subtotalPoints.toFixed(2)} Pts
                  </Typography>
                </ListItem>

                {/* Detalles de la Pieza */}
                <Box sx={{ pl: 2, pr: 2, py: 1 }}>
                  {/* Base Material */}
                  <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      Encimera (Material Base)
                    </Typography>
                    <Typography variant="body2">{piece.basePricePoints.toFixed(2)} Pts</Typography>
                  </Box>

                  {/* Addons */}
                  {piece.addons.map((addon, aIdx) => (
                    <Box key={aIdx} sx={{ display: "flex", justifyContent: "space-between", py: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        + {addon.addonName}
                      </Typography>
                      <Typography variant="body2">{addon.pricePoints.toFixed(2)} Pts</Typography>
                    </Box>
                  ))}
                </Box>
                <Divider />
              </React.Fragment>
            ))}

            {/* TOTAL FINAL */}
            <ListItem sx={{ backgroundColor: "primary.main", color: "white" }}>
              <ListItemText primary="TOTAL PUNTOS" primaryTypographyProps={{ variant: "h6" }} />
              <Typography variant="h5" fontWeight="bold">
                {result.totalPoints.toFixed(2)}
              </Typography>
            </ListItem>
          </List>
        </Paper>
      </Box>
    );
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
        <Button variant="outlined" sx={{ mt: 3 }} onClick={() => window.location.reload()}>
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

        {error && <ApiErrorFeedback error={error} title="No se pudo calcular el presupuesto" onRetry={handleCalculate} />}
      </Paper>

      {/* DESGLOSE (Solo visible tras calcular) */}
      {calculationResult && (
        <>
          {renderBreakdown()}

          {/* FORMULARIO DE CONTACTO */}
          <Box sx={{ mt: 5 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
              Datos de Contacto
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
          {open3D && (
            <Countertop3DViewer
              mainPieces={mainPieces}
              // Pasamos la imagen del material seleccionado en el paso 1
              materialImage={(wizardTempMaterial as any)?.materialImage} // Asegúrate que tu type tenga imageUrl o usa 'any' temporalmente
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};
