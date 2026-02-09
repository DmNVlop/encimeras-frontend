import { Box, Typography, Paper, TextField, Button, Avatar } from "@mui/material";

export default function UserProfile() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Configuración de Perfil
      </Typography>

      <Paper sx={{ p: 4, mt: 3, maxWidth: 800 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
          <Avatar sx={{ width: 80, height: 80, fontSize: "2rem", bgcolor: "primary.light", color: "primary.main", mr: 3 }}>JD</Avatar>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Juan Diseño S.L.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cliente Profesional
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3 }}>
          <TextField fullWidth label="Nombre de Empresa" defaultValue="Reformas y Diseños Juan S.L." />
          <TextField fullWidth label="CIF / NIF" defaultValue="B-12345678" />
          <TextField fullWidth label="Email Contacto" defaultValue="juan@reformasjuan.com" />
          <TextField fullWidth label="Teléfono" defaultValue="+34 600 000 000" />
        </Box>

        <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end", gap: 2 }}>
          <Button variant="text" color="inherit">
            Cancelar
          </Button>
          <Button variant="contained">Guardar Cambios</Button>
        </Box>
      </Paper>
    </Box>
  );
}
