import { Box, Typography, Button, Container } from "@mui/material";
import { Refresh as RefreshIcon, Dashboard as DashboardIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

interface ServerErrorPageProps {
  errorCode?: string;
}

const ServerErrorPage: React.FC<ServerErrorPageProps> = ({ errorCode = "SYS_ERR_5920" }) => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f4f6f9",
        textAlign: "center",
        p: 3,
      }}
    >
      <Container maxWidth="sm">
        {/* Friendly Illustration */}
        <Box
          component="img"
          src="/assets/friendly-error.png" // This will be the placeholder for the generated image
          alt="Contratiempo técnico"
          sx={{
            width: "100%",
            maxWidth: 320,
            height: "auto",
            mb: 4,
            filter: "drop-shadow(0px 10px 20px rgba(0,0,0,0.05))",
          }}
        />

        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            color: "#1e293b",
            mb: 2,
            lineHeight: 1.3,
          }}
        >
          ¡Ups! Tenemos un pequeño contratiempo
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: "text.secondary",
            mb: 5,
            fontSize: "1.1rem",
            maxWidth: 450,
            mx: "auto",
          }}
        >
          Parece que algo no ha funcionado como debería en nuestros servidores. No te preocupes, esto suele ser pasajero.
        </Typography>

        <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<RefreshIcon />}
            onClick={() => window.location.reload()}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 3,
              textTransform: "none",
              fontWeight: 700,
              bgcolor: "primary.main",
              boxShadow: "0 8px 16px rgba(59, 113, 202, 0.24)",
              "&:hover": {
                bgcolor: "primary.dark",
                boxShadow: "0 10px 20px rgba(59, 113, 202, 0.32)",
              },
            }}
          >
            Reintentar ahora
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<DashboardIcon />}
            onClick={() => navigate("/")}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 3,
              textTransform: "none",
              fontWeight: 700,
              color: "text.primary",
              borderColor: "grey.300",
              bgcolor: "background.paper",
              "&:hover": {
                borderColor: "grey.400",
                bgcolor: "grey.50",
              },
            }}
          >
            Ir al inicio
          </Button>
        </Box>

        {/* Discrete Error Info */}
        <Typography
          variant="caption"
          sx={{
            display: "block",
            mt: 8,
            color: "grey.400",
            fontFamily: "monospace",
          }}
        >
          ID del reporte: {errorCode}
        </Typography>
      </Container>
    </Box>
  );
};

export default ServerErrorPage;
