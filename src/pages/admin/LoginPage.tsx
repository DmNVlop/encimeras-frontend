// src/pages/admin/LoginPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Button, TextField, Typography, Box, CircularProgress, Paper, Fade } from "@mui/material";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/auth.types";
import { ApiErrorFeedback } from "../public/common/ApiErrorFeedback";
import { SettingsService } from "@/services/settings.service";
import type { LoginSettings } from "@/types/settings.types";

const DEFAULT_SETTINGS: LoginSettings = {
  title: "Presupuestador Kuuk",
  description: "Ingresa tus credenciales para continuar",
  imageUrl: "/encimeras_1920x1080.jpg",
  logoUrl:
    "https://sp-ao.shortpixel.ai/client/to_webp,q_glossy,ret_img,w_124,h_53/https://kuukencimeras.com/wp-content/uploads/2021/02/cropped-cropped-Logo-kuuk-bok-1-e1714466793783.png",
};

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<any>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [settings, setSettings] = useState<LoginSettings>(DEFAULT_SETTINGS);

  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();

  // Load settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await SettingsService.getLoginSettings();
        if (data) {
          setSettings({
            ...DEFAULT_SETTINGS,
            ...data,
          });
        }
      } catch (err) {
        console.error("Failed to load settings", err);
      }
    };
    fetchSettings();
  }, []);

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

  const handleLogin = async (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    setError(null);
    setLocalLoading(true);

    try {
      await login(username, password);
    } catch (err: any) {
      setLocalLoading(false);
      setTimeout(() => {
        setError(err);
      }, 100);
      return;
    }
    setLocalLoading(false);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.1)), url(${settings.imageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        p: 3,
      }}
    >
      <Fade in={true} timeout={1200}>
        <Box
          sx={{
            width: "100%",
            maxWidth: 350, // Even more compact
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              borderRadius: "20px",
              background: "rgba(255, 255, 255, 0.08)", // Slightly more opaque since we removed blur
              border: "1px solid rgba(255, 255, 255, 0.1)",
              width: "360px",
              position: "absolute",
              left: "10%",
              top: "6%",
            }}
          >
            {settings.logoUrl && (
              <Box
                component="img"
                src={settings.logoUrl}
                alt="Logo"
                sx={{
                  height: 46, // Back to requested size
                  mb: 2,
                  objectFit: "contain",
                }}
              />
            )}

            <Typography component="h1" variant="h6" fontWeight="500" align="center" sx={{ color: "#fff", mb: 0.5, opacity: 0.9 }}>
              {settings.title}
            </Typography>

            <Typography variant="caption" align="center" sx={{ color: "rgba(255, 255, 255, 0.5)", mb: 4 }}>
              {settings.description}
            </Typography>

            <Box component="form" onSubmit={handleLogin} noValidate sx={{ width: "100%" }}>
              <TextField
                margin="dense"
                required
                fullWidth
                id="username"
                label="Usuario"
                name="username"
                autoComplete="username"
                disabled={localLoading}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                variant="standard" // Minimalist style
                sx={{
                  mb: 2,
                  "& .MuiInput-underline:before": { borderBottomColor: "rgba(255, 255, 255, 0.2)" },
                  "& .MuiInput-underline:hover:not(.Mui-disabled):before": { borderBottomColor: "rgba(255, 255, 255, 0.4)" },
                  "& .MuiInput-underline:after": { borderBottomColor: "#fff" },
                  "& .MuiInputBase-input": { color: "#fff", padding: "8px 6px", borderRadius: "6px" },
                  "& .MuiInputLabel-root": { color: "rgba(255, 255, 255, 0.4)", fontSize: "0.85rem" },
                  "& .MuiInputLabel-root.Mui-focused": { color: "#fff" },
                }}
              />
              <TextField
                margin="dense"
                required
                fullWidth
                name="password"
                label="Contraseña"
                type="password"
                id="password"
                autoComplete="current-password"
                disabled={localLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                variant="standard" // Minimalist style
                sx={{
                  mb: 3,
                  "& .MuiInput-underline:before": { borderBottomColor: "rgba(255, 255, 255, 0.2)" },
                  "& .MuiInput-underline:hover:not(.Mui-disabled):before": { borderBottomColor: "rgba(255, 255, 255, 0.4)" },
                  "& .MuiInput-underline:after": { borderBottomColor: "#fff" },
                  "& .MuiInputBase-input": { color: "#fff", padding: "8px 6px", borderRadius: "6px" },
                  "& .MuiInputLabel-root": { color: "rgba(255, 255, 255, 0.4)", fontSize: "0.85rem" },
                  "& .MuiInputLabel-root.Mui-focused": { color: "#fff" },
                }}
              />

              <ApiErrorFeedback
                error={error}
                sx={{
                  mt: 0,
                  mb: 2,
                  fontSize: "0.75rem",
                  color: "#ff8a80",
                  "& .MuiAlert-icon": { display: "none" },
                  "& .MuiAlert-message": { p: 0 },
                  backgroundColor: "transparent",
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="outlined"
                sx={{
                  py: 1.2,
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: "500",
                  borderColor: "rgba(255, 255, 255, 0.3)",
                  color: "#fff",
                  "&:hover": {
                    borderColor: "#fff",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                  },
                }}
                disabled={localLoading}
              >
                {localLoading ? <CircularProgress size={20} color="inherit" /> : "Iniciar Sesión"}
              </Button>
            </Box>

            <Typography variant="caption" sx={{ mt: 3, color: "rgba(255, 255, 255, 0.3)", fontSize: "0.7rem", alignSelf: "center" }}>
              © {new Date().getFullYear()} Presupuestador de encimeras
            </Typography>
          </Paper>
        </Box>
      </Fade>
    </Box>
  );
};

export default LoginPage;
