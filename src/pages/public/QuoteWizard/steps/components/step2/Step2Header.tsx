import React from "react";
import { Box, Typography, Avatar, useTheme } from "@mui/material";
import StraightenIcon from "@mui/icons-material/Straighten";

interface Step2HeaderProps {
  title: string;
  subtitle: string;
}

export const Step2Header: React.FC<Step2HeaderProps> = ({ title, subtitle }) => {
  const theme = useTheme();

  return (
    <Box sx={{ mb: 4, display: "flex", alignItems: "center", gap: 2 }}>
      <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
        <StraightenIcon />
      </Avatar>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: "bold", color: "#333" }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      </Box>
    </Box>
  );
};
