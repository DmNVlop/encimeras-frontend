import React from "react";
import { Box, Typography } from "@mui/material";
import AdminPageTitle from "../AdminPageTitle";

interface DashboardHeaderProps {
  lastUpdated: Date | null;
  loading: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ lastUpdated, loading }) => {
  return (
    <Box>
      <AdminPageTitle>Dashboard Operativo</AdminPageTitle>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{
          mt: 1,
          opacity: 0.8,
          fontStyle: "italic",
          display: "flex",
          alignItems: "center",
        }}
      >
        Métricas clave de producción y ventas.
        {lastUpdated && !loading && (
          <Box component="span" sx={{ ml: 2, fontSize: "0.75rem", opacity: 0.6, fontWeight: 400 }}>
            Actualizado: {lastUpdated.toLocaleTimeString()}
          </Box>
        )}
      </Typography>
    </Box>
  );
};
