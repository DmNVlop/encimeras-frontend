import { Box, Typography, Button } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";

export default function MyQuotes() {
  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Mis Pedidos
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          Nuevo Presupuesto
        </Button>
      </Box>

      <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
        <Typography variant="h6">No tienes pedidos realizados aún.</Typography>
        <Typography variant="body2">Tus pedidos confirmados aparecerán aquí.</Typography>
      </Box>
    </Box>
  );
}
