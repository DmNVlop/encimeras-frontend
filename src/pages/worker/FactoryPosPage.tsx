import React from "react";
import { Box, Typography, Button, Container } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "@/hooks/useAuth";

const FactoryPosPage: React.FC = () => {
  const { logout, user } = useAuth();

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          gap: 3,
        }}
      >
        <Typography variant="h3" component="h1" gutterBottom>
          Página para los Operarios
        </Typography>

        <Typography variant="h6" color="text.secondary">
          Bienvenido, {user?.name || user?.username || "Operario"}
        </Typography>

        <Box mt={4}>
          <Button variant="contained" color="error" size="large" startIcon={<LogoutIcon />} onClick={() => logout()}>
            Cerrar Sesión
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default FactoryPosPage;
