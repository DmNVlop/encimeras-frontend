// src/pages/admin/DashboardPage.tsx
import React from "react";
import { Box, Typography } from "@mui/material";

// URL de la imagen de fondo que hemos generado.
const backgroundImageUrl = "/dashboard_bg.png";

const DashboardPage: React.FC = () => {
  return (
    <Box
      sx={{
        height: "calc(85vh)", // Ocupa la mayor parte de la altura visible
        width: "100%",
        maxWidth: "800px",
        margin: "0 auto",
        backgroundImage: `url(${backgroundImageUrl})`,
        backgroundSize: "contain",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        borderRadius: 2, // Bordes redondeados para integrarse con el layout
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        textShadow: "2px 2px 4px rgba(0,0,0,0.6)", // Sombra para que el texto sea legible
      }}>
      <Typography variant="h2" component="h1" sx={{ fontWeight: "bold" }}>
        Bienvenido al Panel
      </Typography>
    </Box>
  );
};

export default DashboardPage;
