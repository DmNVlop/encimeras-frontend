import { Box, Typography, Button } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

export default function MyQuotes() {
  const navigate = useNavigate();

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Mis Pedidos
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/quote")}>
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
