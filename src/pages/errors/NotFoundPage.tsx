import React from "react";
import { Box, Typography, Button, Container } from "@mui/material";
import { Search as SearchIcon, Home as HomeIcon, ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f4f6f9",
        textAlign: "center",
        p: 3,
      }}
    >
      <Container maxWidth="md">
        <Box sx={{ position: "relative", mb: 4 }}>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: "8rem", md: "12rem" },
              fontWeight: 800,
              color: "grey.200",
              lineHeight: 1,
              userSelect: "none",
            }}
          >
            404
          </Typography>
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Box
              sx={{
                bgcolor: "background.paper",
                p: 2,
                borderRadius: "50%",
                boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                border: "1px solid",
                borderColor: "grey.100",
                display: "flex",
              }}
            >
              <SearchIcon sx={{ fontSize: { xs: 40, md: 60 }, color: "primary.main" }} />
            </Box>
          </Box>
        </Box>

        <Typography variant="h4" sx={{ fontWeight: 700, color: "text.primary", mb: 2 }}>
          Página no encontrada
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: "text.secondary",
            mb: 4,
            maxWidth: "500px",
            mx: "auto",
            fontSize: "1.1rem",
          }}
        >
          Lo sentimos, la página que intentas buscar no existe, ha sido movida o el enlace es incorrecto.
        </Typography>

        <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
          <Button
            variant="contained"
            startIcon={<HomeIcon />}
            onClick={() => navigate("/")}
            sx={{
              px: 3,
              py: 1.5,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              boxShadow: "none",
              "&:hover": { boxShadow: "0 4px 12px rgba(59, 113, 202, 0.2)" },
            }}
          >
            Volver al Inicio
          </Button>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{
              px: 3,
              py: 1.5,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              color: "text.primary",
              borderColor: "grey.300",
              bgcolor: "background.paper",
              "&:hover": {
                borderColor: "grey.400",
                bgcolor: "grey.50",
              },
            }}
          >
            Página Anterior
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default NotFoundPage;
