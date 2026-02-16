// src/pages/admin/LoginPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Button, TextField, Container, Typography, Box, CircularProgress } from "@mui/material";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/auth.types";
import { ApiErrorFeedback } from "../public/common/ApiErrorFeedback";

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<any>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const navigate = useNavigate();

  const { login, isAuthenticated, user } = useAuth();

  // redirection logic based on roles
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log("LoginPage: Authenticated, redirecting...");
      const userRoles = user.roles || [];

      // Logic for hierarchy redirection
      if (userRoles.includes(UserRole.ADMIN) || userRoles.includes(UserRole.SALES_FACTORY)) {
        navigate("/admin/orders", { replace: true });
      } else if (userRoles.includes(UserRole.WORKER)) {
        navigate("/factory/queue", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Log para ver cambios en error
  useEffect(() => {
    console.log("LoginPage: State 'error' changed:", error);
  }, [error]);

  console.log("LoginPage: Render. localLoading:", localLoading, "Error:", error);

  const handleLogin = async (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    console.log("LoginPage: handleLogin started.");

    // Clear previous error
    setError(null);
    setLocalLoading(true);

    try {
      console.log("LoginPage: Calling login context...");
      await login(username, password);
    } catch (err: any) {
      console.error("LoginPage: CATCH triggered.", err);

      // Intentional delay to ensure UI stability before showing error
      setLocalLoading(false);
      setTimeout(() => {
        console.log("LoginPage: Setting error state now:", err);
        setError(err);
      }, 100);
      return;
    }

    // Only turn off loading here if successful (catch returns early)
    setLocalLoading(false);
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography component="h1" variant="h5">
          Admin Login
        </Typography>
        <Box component="form" onSubmit={handleLogin} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Usuario"
            name="username"
            autoComplete="username"
            placeholder="Nombre de Usuario, ej: usuario@usuario.com"
            autoFocus
            disabled={localLoading}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Contraseña"
            type="password"
            id="password"
            autoComplete="current-password"
            placeholder="Contraseña..."
            disabled={localLoading}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <ApiErrorFeedback error={error} title="Error al iniciar sesión" sx={{ mt: 2 }} />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={localLoading}
            startIcon={localLoading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {localLoading ? "Iniciando Sesión..." : "Iniciar Sesión"}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default LoginPage;
