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
    // Valores por defecto
    let friendlyMsg = "Ha ocurrido un error inesperado.";
    let techMsg = "";

    // CASO 1: Error es un String simple (Legacy o errores manuales)
    if (typeof err === "string") {
      friendlyMsg = err;
      techMsg = err;
    }
    // CASO 2: Error estructurado del backend (NestJS standard)
    // Formato esperado: { message: string, error: string, statusCode: number }
    else if (err?.statusCode && err?.error) {
      friendlyMsg = err.message || "Error desconocido";
      techMsg = JSON.stringify(err, null, 2);
    }
    // CASO 3: Error de Axios con response (Legacy o errores no controlados arriba)
    else if (err?.response?.data) {
      const data = err.response.data;

      // A. Extracción del Mensaje Técnico (Para el Collapse)
      // NestJS suele devolver: { message: "...", error: "...", statusCode: ... }
      if (typeof data.message === "string") {
        techMsg = data.message;
      } else if (Array.isArray(data.message)) {
        // Validación de DTOs (Array de errores)
        techMsg = data.message.join("\n");
      } else {
        // Fallback: mostrar todo el JSON
        techMsg = JSON.stringify(data, null, 2);
      }

      // B. Mensaje Amigable (Para el Usuario)
      // Lógica específica para tu caso de Precios
      if (techMsg.includes("Price not found") || techMsg.includes("Pricing recipe")) {
        friendlyMsg = "Falta configuración de precio para la combinación de materiales seleccionada.";
      } else if (data.statusCode === 401 || techMsg.toLowerCase().includes("unauthorized")) {
        friendlyMsg = "Usuario o contraseña incorrectos.";
      } else if (data.statusCode === 404) {
        friendlyMsg = "No se encontraron datos para procesar la solicitud (404).";
      } else if (data.statusCode === 400) {
        friendlyMsg = "Revisa los datos seleccionados, hay información incompatible.";
      } else {
        // Si no reconocemos el error, mostramos el mensaje del backend si no es muy largo
        friendlyMsg = techMsg.length < 150 ? techMsg : "Error de comunicación con el servidor.";
      }
    }
    // CASO 3: Error Objeto Simple (generado manualmente o por lógica de UI)
    else if (err?.message && !err?.response && !err?.request) {
      friendlyMsg = err.message;
      techMsg = JSON.stringify(err, null, 2);
    }
    // CASO 4: Error de Red (Sin respuesta del servidor, tiene request pero no response)
    else if (err?.message) {
      techMsg = err.message;
      friendlyMsg = "Error de conexión. Verifica tu internet o si el servidor está activo.";
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
              fontFamily: "Monaco, Consolas, 'Courier New', monospace", // Fuente monoespaciada vital para leer JSON/Logs
              fontSize: "0.8rem",
              color: "#d32f2f",
              overflowX: "auto",
            }}
          >
            {/* Aquí se imprime el mensaje tal cual viene del Backend */}
            <strong>Server Message:</strong>
            <br />
            {techMsg || "No details provided."}
          </Box>
        </Collapse>
      </Box>
    </Alert>
  );
};
