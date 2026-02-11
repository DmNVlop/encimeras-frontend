import { Box, Typography, Paper, Button } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h4" fontWeight="bold">
          Resumen
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/quote")}>
          Nuevo Presupuesto
        </Button>
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" }, gap: 3 }}>
        <Paper sx={{ p: 3, height: "100%" }}>
          <Typography variant="h6">Actividad Reciente</Typography>
          <Typography color="text.secondary">No tienes actividad reciente.</Typography>
        </Paper>
        <Paper sx={{ p: 3, height: "100%" }}>
          <Typography variant="h6">Mis Estadísticas</Typography>
          <Typography color="text.secondary">0 Presupuestos</Typography>
        </Paper>
      </Box>
    </Box>
  );
}
