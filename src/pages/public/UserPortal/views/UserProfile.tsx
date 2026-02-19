// src/pages/public/UserPortal/views/UserProfile.tsx
import React, { useState, useEffect } from "react";
import { Box, Typography, Paper, TextField, Button, Avatar, Grid, Alert, CircularProgress } from "@mui/material";
import { useAuth } from "@/hooks/useAuth";
import { update } from "@/services/api.service";
import AdminPageTitle from "@/pages/admin/components/AdminPageTitle";
import PersonIcon from "@mui/icons-material/Person";

export default function UserProfile() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        password: "",
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?._id && !user?.id) return;

    setLoading(true);
    setMessage(null);

    const userId = user._id || user.id!;
    const payload: any = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
    };

    if (formData.password) {
      payload.password = formData.password;
    }

    try {
      await update("/users", userId, payload);
      await refreshUser();
      setMessage({ type: "success", text: "Perfil actualizado correctamente." });
      setFormData((prev) => ({ ...prev, password: "" }));
    } catch (error: any) {
      console.error("Error updating profile:", error);
      setMessage({
        type: "error",
        text: error?.message || "Ocurrió un error al actualizar el perfil. Es posible que no tengas permisos.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <AdminPageTitle sx={{ mb: 4 }}>Configuración de Perfil</AdminPageTitle>

      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: "16px",
          background: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(0, 0, 0, 0.05)",
          maxWidth: 900,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 5 }}>
          <Avatar
            sx={{
              width: 100,
              height: 100,
              fontSize: "2.5rem",
              bgcolor: "primary.main",
              boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
              mr: 4,
            }}
          >
            {user.name ? user.name.charAt(0).toUpperCase() : <PersonIcon sx={{ fontSize: "3rem" }} />}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight="700" color="text.primary">
              {user.name || user.username}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {user.roles.join(", ")} • {user.username}
            </Typography>
          </Box>
        </Box>

        {message && (
          <Alert severity={message.type} sx={{ mb: 4, borderRadius: "10px" }}>
            {message.text}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSave}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Nombre Completo / Razón Social" name="name" value={formData.name} onChange={handleChange} variant="outlined" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombre de Usuario"
                value={user.username}
                disabled
                variant="outlined"
                helperText="El nombre de usuario no se puede cambiar"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Correo Electrónico" name="email" type="email" value={formData.email} onChange={handleChange} variant="outlined" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Teléfono de Contacto" name="phone" value={formData.phone} onChange={handleChange} variant="outlined" />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ mt: 2, p: 3, bgcolor: "rgba(0,0,0,0.02)", borderRadius: "12px" }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Seguridad
                </Typography>
                <TextField
                  fullWidth
                  label="Nueva Contraseña"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  variant="outlined"
                  helperText="Dejar en blanco para mantener la contraseña actual (mínimo 6 caracteres)"
                  sx={{ mt: 1 }}
                />
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ mt: 5, display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <Button
              variant="contained"
              type="submit"
              disabled={loading}
              sx={{
                px: 4,
                py: 1.2,
                borderRadius: "10px",
                textTransform: "none",
                fontSize: "1rem",
                fontWeight: "600",
                boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Guardar Cambios"}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
