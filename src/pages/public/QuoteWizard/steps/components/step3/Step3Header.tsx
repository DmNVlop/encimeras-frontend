import React from "react";
import { Box, Typography, Avatar, useTheme } from "@mui/material";
import HandymanIcon from "@mui/icons-material/Handyman";

export const Step3Header: React.FC = () => {
  const theme = useTheme();

  return (
    <Box sx={{ mb: 4, display: "flex", alignItems: "center", gap: 2 }}>
      <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
        <HandymanIcon />
      </Avatar>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: "bold", color: "#333" }}>
          Trabajos y Ensamblajes
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configura cómo se unen las piezas y añade recortes o encastres.
        </Typography>
      </Box>
    </Box>
  );
};
