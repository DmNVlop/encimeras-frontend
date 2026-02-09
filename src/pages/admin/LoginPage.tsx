// src/pages/admin/LoginPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Button, TextField, Container, Typography, Box, CircularProgress } from "@mui/material";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/auth.types";
import { ApiErrorFeedback } from "../public/common/ApiErrorFeedback";

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<any>(null);
  const navigate = useNavigate();

  const { login, isLoading, isAuthenticated, user } = useAuth();

  // redirection logic based on roles
  useEffect(() => {
    if (isAuthenticated && user) {
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

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    try {
      await login(username, password);
      // navigation handled by useEffect
    } catch (err: any) {
      console.error("Login Error:", err);
      // api.service returns a string for errors, which ApiErrorFeedback handles gracefully.
      // We pass it directly to avoid misinterpretation as a network error by the component.
      setError(err);
    }
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
            autoFocus
            disabled={isLoading}
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
            disabled={isLoading}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <ApiErrorFeedback error={error} title="Error al iniciar sesión" sx={{ mt: 2 }} />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isLoading ? "Iniciando Sesión..." : "Iniciar Sesión"}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default LoginPage;
