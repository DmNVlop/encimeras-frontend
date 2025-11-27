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

  if (!error) return null;

  // --- LÓGICA DE TRADUCCIÓN E EXTRACCIÓN ---
  const parseErrorMessage = (err: any) => {
    let friendlyMsg = "Ha ocurrido un error de conexión o el servidor no responde.";
    let techMsg = "";

    // 1. Si es un error que viene del Backend (Axios response)
    if (err?.response?.data) {
      const data = err.response.data;

      // --- A: EXTRAER EL MENSAJE TÉCNICO PURO ---
      // Priorizamos 'message' sobre todo lo demás
      const rawMessage = data.message;

      if (Array.isArray(rawMessage)) {
        // Caso Class-Validator: ["length must be a number", "width must be..."]
        techMsg = rawMessage.join("\n");
      } else if (typeof rawMessage === "string") {
        // Caso NestJS standard: "Pricing recipe not found..."
        techMsg = rawMessage;
      } else {
        // Fallback: Si no hay message, mostramos todo el objeto
        techMsg = JSON.stringify(data, null, 2);
      }

      // --- B: TRADUCIR A LENGUAJE HUMANO (FRIENDLY) ---
      // Usamos 'techMsg' que ya contiene el texto real para buscar palabras clave

      if (techMsg.includes("Pricing recipe")) {
        friendlyMsg = "El material seleccionado no tiene configurada una tarifa de precios válida para este tipo de producto.";
      } else if (data.statusCode === 404) {
        friendlyMsg = "No se han encontrado los datos necesarios en el servidor.";
      } else if (data.statusCode === 400) {
        friendlyMsg = "La configuración enviada contiene datos incorrectos o incompletos.";
      } else {
        // Si no identificamos el error, usamos el mensaje del backend si es corto
        friendlyMsg = techMsg.length < 120 ? techMsg : "Error al procesar la solicitud.";
      }
    }
    // 2. Errores de Red / Cliente
    else if (err?.message) {
      techMsg = err.message;
      if (err.message === "Network Error") {
        friendlyMsg = "No se puede conectar con el servidor. Verifica tu conexión.";
      } else {
        friendlyMsg = err.message; // Fallback genérico
      }
    }

    return { friendlyMsg, techMsg };
  };

  const { friendlyMsg, techMsg } = parseErrorMessage(error);

  return (
    <Alert
      severity="error"
      sx={{ mt: 2, mb: 2, ...sx }}
      className="mt-2"
      action={
        onRetry && (
          <Button color="inherit" size="small" startIcon={<RefreshIcon />} onClick={onRetry}>
            Reintentar
          </Button>
        )
      }
    >
      <AlertTitle sx={{ fontWeight: "bold" }}>{title}</AlertTitle>

      {/* Mensaje para el Usuario Final */}
      <Typography variant="body2" sx={{ mb: 1 }}>
        {friendlyMsg}
      </Typography>

      {/* Sección de Detalles Técnicos */}
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
          <Typography variant="caption" color="error" sx={{ fontWeight: "bold", textTransform: "uppercase", fontSize: "0.7rem" }}>
            {showDetails ? "Ocultar detalles" : "Ver detalles del error"}
          </Typography>
          <IconButton size="small" sx={{ p: 0, ml: 0.5 }}>
            {showDetails ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </Box>

        <Collapse in={showDetails}>
          <Box
            sx={{
              mt: 1,
              p: 1.5,
              bgcolor: "#FFF4F4", // Fondo muy claro
              border: "1px solid #FFCDD2", // Borde rojo claro
              borderRadius: 1,
              fontFamily: "Consolas, Monaco, 'Andale Mono', monospace",
              fontSize: "0.8rem",
              color: "#C62828", // Rojo oscuro legible
              whiteSpace: "pre-wrap", // Respeta saltos de línea
              wordBreak: "break-word",
            }}
          >
            {/* Aquí se imprime DIRECTAMENTE el string del error */}
            {techMsg || "Sin detalles disponibles."}
          </Box>
        </Collapse>
      </Box>
    </Alert>
  );
};
