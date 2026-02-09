import { Box, Typography, Paper } from "@mui/material";

export default function Dashboard() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Resumen
      </Typography>
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
