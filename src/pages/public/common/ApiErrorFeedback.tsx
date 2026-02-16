import React, { useState } from "react";
import { Alert, AlertTitle, Box, Collapse, IconButton, Typography, Button } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import RefreshIcon from "@mui/icons-material/Refresh";

interface ApiErrorFeedbackProps {
  error: any;
  title?: string;
  onRetry?: () => void;
  sx?: any;
}

export const ApiErrorFeedback: React.FC<ApiErrorFeedbackProps> = ({ error, title = "No se pudo completar la acción", onRetry, sx }) => {
  const [showDetails, setShowDetails] = useState(false);

  // --- LÓGICA DE TRADUCCIÓN E EXTRACCIÓN ---
  const parseErrorMessage = (err: any) => {
    // Valores por defecto
    let friendlyMsg = "Ha ocurrido un error inesperado.";
    let techMsg = "";
    let statusCode = 0;

    if (!err) return { friendlyMsg: "", techMsg: "" };

    // 1. Extracción de Datos y Status (Normalización)
    const responseData = err?.response?.data || (err?.statusCode ? err : null) || err;
    statusCode = err?.response?.status || err?.statusCode || responseData?.statusCode || 0;

    // 2. Extracción del Mensaje Técnico (techMsg)
    if (typeof err === "string") {
      techMsg = err;
    } else if (responseData?.message) {
      techMsg = Array.isArray(responseData.message) ? responseData.message.join("\n") : responseData.message;
    } else if (err?.message) {
      techMsg = err.message;
    } else {
      techMsg = JSON.stringify(err, null, 2);
    }

    // 3. Traducción a Mensaje Amigable (friendlyMsg)
    if (statusCode === 401 || techMsg.toLowerCase().includes("unauthorized")) {
      friendlyMsg = "Usuario o contraseña incorrectos.";
    } else if (statusCode === 403) {
      friendlyMsg = "No tienes permisos para realizar esta acción.";
    } else if (statusCode === 404) {
      friendlyMsg = "El recurso solicitado no existe (404).";
    } else if (statusCode === 400) {
      friendlyMsg = "Los datos enviados son inválidos o incompatibles.";
    } else if (techMsg.includes("Price not found") || techMsg.includes("Pricing recipe")) {
      friendlyMsg = "Falta configuración de precio para la combinación seleccionada.";
    } else if (techMsg.includes("Network Error") || (err && !statusCode)) {
      friendlyMsg = "Error de conexión. Verifica tu internet o el estado del servidor.";
    } else if (techMsg && techMsg.length < 100) {
      friendlyMsg = techMsg;
    }

    return { friendlyMsg, techMsg };
  };

  const { friendlyMsg, techMsg } = parseErrorMessage(error);

  // Si no hay error, no mostramos nada
  if (!error) return null;

  return (
    <Alert
      severity="error"
      sx={{ mt: 2, mb: 2, border: "1px solid #d32f2f", ...sx }}
      action={
        onRetry && (
          <Button color="inherit" size="small" startIcon={<RefreshIcon />} onClick={onRetry}>
            Reintentar
          </Button>
        )
      }
    >
      <AlertTitle sx={{ fontWeight: "bold" }}>{title}</AlertTitle>

      <Typography variant="body2" sx={{ mb: 1 }}>
        {friendlyMsg}
      </Typography>

      <Box sx={{ mt: 1 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            width: "fit-content",
            "&:hover": { textDecoration: "underline" },
          }}
          onClick={() => setShowDetails(!showDetails)}
        >
          <Typography variant="caption" color="error" sx={{ fontWeight: "bold", textTransform: "uppercase", fontSize: "0.75rem" }}>
            {showDetails ? "Ocultar detalles técnicos" : "Ver qué falló exactamente"}
          </Typography>
          <IconButton size="small" sx={{ p: 0, ml: 0.5 }}>
            {showDetails ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </Box>

        <Collapse in={showDetails}>
          <Box
            sx={{
              mt: 1,
              p: 2,
              bgcolor: "#fff",
              border: "1px solid #ffcdd2",
              borderRadius: 1,
              fontFamily: "Monaco, Consolas, 'Courier New', monospace",
              fontSize: "0.8rem",
              color: "#d32f2f",
              overflowX: "auto",
            }}
          >
            <strong>Server Message:</strong>
            <br />
            {techMsg || "No details provided."}
          </Box>
        </Collapse>
      </Box>
    </Alert>
  );
};
