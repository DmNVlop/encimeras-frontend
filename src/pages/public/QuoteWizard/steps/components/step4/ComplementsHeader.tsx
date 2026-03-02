import React from "react";
import { Box, Typography, Avatar, useTheme } from "@mui/material";
import ExtensionIcon from "@mui/icons-material/Extension";

export const ComplementsHeader: React.FC = () => {
  const theme = useTheme();

  return (
    <Box sx={{ mb: 4, display: "flex", alignItems: "center", gap: 2 }}>
      <Avatar sx={{ bgcolor: theme.palette.secondary.main }}>
        <ExtensionIcon />
      </Avatar>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: "bold", color: "#333" }}>
          Complementos y Accesorios
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Añade copetes, costados vistos, tiras u otros extras a cada pieza.
        </Typography>
      </Box>
    </Box>
  );
};
