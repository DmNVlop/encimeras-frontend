import React from "react";
import { Box, Typography, Button, Paper, Avatar } from "@mui/material";
import { Lock as LockIcon, GridView as GridViewIcon, Email as EmailIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Obtenemos el rol principal o nombre del usuario para el mensaje
  const userRoleName = user?.roles?.[0] || "Usuario";

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f4f6f9",
        p: 3,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: 700,
          p: { xs: 4, md: 6 },
          borderRadius: 4,
          border: "1px solid",
          borderColor: "grey.200",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: "center",
          gap: 4,
        }}
      >
        <Avatar
          sx={{
            width: 100,
            height: 100,
            bgcolor: "error.lighter", // Usamos el color de error del tema si existe, o uno suave
            color: "error.main",
            border: "1px solid",
            borderColor: "error.light",
            "& .MuiSvgIcon-root": { fontSize: 50 },
            // Fallback si no hay theme.palette.error.lighter
            backgroundColor: "rgba(211, 47, 47, 0.04)",
          }}
        >
          <LockIcon />
        </Avatar>

        <Box sx={{ textAlign: { xs: "center", md: "left" } }}>
          <Typography variant="overline" sx={{ fontWeight: 800, color: "error.main", letterSpacing: 1.5 }}>
            Error 403
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1.5, color: "text.primary" }}>
            Acceso Denegado
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary", mb: 4, fontSize: "1.05rem" }}>
            Tu cuenta actual (<strong>{userRoleName}</strong>) no tiene los permisos de seguridad necesarios para visualizar esta sección del portal de
            presupuestos.
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, justifyContent: { xs: "center", md: "flex-start" } }}>
            <Button
              variant="contained"
              startIcon={<GridViewIcon />}
              onClick={() => navigate("/admin")}
              sx={{
                bgcolor: "#1e293b", // Navy dark similar to design
                color: "white",
                px: 3,
                py: 1.2,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                "&:hover": { bgcolor: "#0f172a" },
              }}
            >
              Ir al Panel Admin
            </Button>
            <Button
              variant="text"
              startIcon={<EmailIcon />}
              sx={{
                color: "primary.main",
                textTransform: "none",
                fontWeight: 600,
                px: 2,
              }}
            >
              Solicitar Acceso
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default ForbiddenPage;
