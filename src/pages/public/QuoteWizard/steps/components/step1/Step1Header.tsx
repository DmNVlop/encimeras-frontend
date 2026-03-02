import React from "react";
import { Box, Typography, Avatar, useTheme } from "@mui/material";
import TextureIcon from "@mui/icons-material/Texture";

export const Step1Header: React.FC = () => {
  const theme = useTheme();

  return (
    <Box sx={{ display: "flex", alignItems: "top", gap: 2 }}>
      <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
        <TextureIcon />
      </Avatar>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: "bold", color: "#333" }}>
          Elige tu Material
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Material base para la construcción de tu encimera.
        </Typography>
      </Box>
    </Box>
  );
};
