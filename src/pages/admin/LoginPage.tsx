// src/pages/admin/LoginPage.tsx
import React, { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { login } from "@/services/authService";
import { Button, TextField, Container, Typography, Box, Link } from "@mui/material";

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // const handleLogin = async (event: React.FormEvent) => {
  //   event.preventDefault();
  //   setError("");
  //   try {
  //     await login({ username, password });
  //     navigate("/admin/materials"); // Redirige al dashboard si el login es exitoso
  //   } catch (err) {
  //     setError("Credenciales incorrectas. Por favor, inténtalo de nuevo.");
  //   }
  // };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    try {
      const data = await login({ username, password });
      console.log("Login exitoso: ", data);

      // 1. Guardar Token y Datos
      localStorage.setItem("token", data.access_token);
      // Opcional: Guardar el usuario en localStorage o Context para no perderlo al refrescar
      // localStorage.setItem("user", JSON.stringify(data.user));

      // 2. Extraemos los roles (asegurando que sea un array)
      const userRoles = data.user.roles || [];

      // 3. Lógica de Redirección por Jerarquía (El orden importa)

      if (userRoles.includes("ADMIN")) {
        // El Admin tiene prioridad absoluta
        navigate("/admin/orders");
      } else if (userRoles.includes("SALES")) {
        // Si no es Admin, pero es Ventas
        navigate("/admin/orders");
      } else if (userRoles.includes("WORKER")) {
        // Si es operario de fábrica
        navigate("/factory/queue");
      } else {
        // USER o cualquier otro caso (Default)
        navigate("/");
      }
    } catch (err) {
      console.error(err);
      setError("Credenciales incorrectas. Por favor, inténtalo de nuevo.");
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
            Iniciar Sesión
          </Button>
          <Box sx={{ textAlign: "center" }}>
            <Link component={RouterLink} to="/presupuesto" variant="body2">
              Ir al presupuestador público
            </Link>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default LoginPage;
