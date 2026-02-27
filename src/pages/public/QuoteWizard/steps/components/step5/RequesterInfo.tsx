import React from "react";
import { Box, Typography, Avatar, Paper, Grid, Stack, Chip, Alert, alpha, useTheme } from "@mui/material";
import Person from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import BadgeIcon from "@mui/icons-material/Badge";
import EventIcon from "@mui/icons-material/Event";

interface RequesterInfoProps {
  user: any;
  submitError: string | null;
}

export const RequesterInfo: React.FC<RequesterInfoProps> = ({ user, submitError }) => {
  const theme = useTheme();

  return (
    <Box sx={{ mt: 5 }}>
      <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
        <Avatar
          sx={{
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: "primary.main",
            width: 32,
            height: 32,
          }}
        >
          <Person fontSize="small" />
        </Avatar>
        <Typography variant="h6" sx={{ fontWeight: "800", color: "text.primary", letterSpacing: -0.5 }}>
          Datos del Solicitante
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 0,
          borderRadius: 4,
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
          background: (theme) =>
            theme.palette.mode === "dark"
              ? "linear-gradient(145deg, rgba(30,30,30,1) 0%, rgba(20,20,20,1) 100%)"
              : "linear-gradient(145deg, #ffffff 0%, #fcfcfc 100%)",
        }}
      >
        <Grid container>
          {/* Columna Izquierda: Avatar y Nombre */}
          <Grid
            size={{ xs: 12, md: 4 }}
            sx={{
              p: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.03),
              borderRight: { md: "1px solid" },
              borderColor: "divider",
            }}
          >
            <Avatar
              sx={{
                width: 100,
                height: 100,
                mb: 2,
                fontSize: "2.5rem",
                fontWeight: "bold",
                bgcolor: "primary.main",
                boxShadow: "0 8px 24px rgba(25, 118, 210, 0.25)",
                border: "4px solid #fff",
              }}
            >
              {user?.name?.charAt(0) || user?.username?.charAt(0) || "U"}
            </Avatar>
            <Typography variant="h5" fontWeight="800" gutterBottom>
              {user?.name || "Usuario"}
            </Typography>
            <Stack direction="row" spacing={1} justifyContent="center">
              {user?.roles?.map((role: string) => (
                <Chip key={role} label={role} size="small" color="primary" variant="outlined" sx={{ fontWeight: "bold", borderRadius: "6px" }} />
              ))}
            </Stack>
          </Grid>

          {/* Columna Derecha: Detalles */}
          <Grid size={{ xs: 12, md: 8 }} sx={{ p: 4 }}>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: "800", letterSpacing: 1.5 }}>
              Información Detallada
            </Typography>

            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar sx={{ bgcolor: "grey.100", color: "grey.600", width: 40, height: 40 }}>
                    <EmailIcon fontSize="small" />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: "bold" }}>
                      Correo Electrónico
                    </Typography>
                    <Typography variant="body1" fontWeight="600">
                      {user?.email || user?.username || "No especificado"}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar sx={{ bgcolor: "grey.100", color: "grey.600", width: 40, height: 40 }}>
                    <PhoneIcon fontSize="small" />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: "bold" }}>
                      Teléfono
                    </Typography>
                    <Typography variant="body1" fontWeight="600">
                      {user?.phone || "No disponible"}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar sx={{ bgcolor: "grey.100", color: "grey.600", width: 40, height: 40 }}>
                    <BadgeIcon fontSize="small" />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: "bold" }}>
                      ID de Usuario
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: "monospace", opacity: 0.8 }}>
                      {user?._id || user?.id || "N/A"}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar sx={{ bgcolor: "grey.100", color: "grey.600", width: 40, height: 40 }}>
                    <EventIcon fontSize="small" />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: "bold" }}>
                      Registrado en
                    </Typography>
                    <Typography variant="body1" fontWeight="600">
                      {user?.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : user?.created_at
                          ? new Date(user.created_at).toLocaleDateString()
                          : "Fecha desconocida"}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            {submitError && (
              <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>
                {submitError}
              </Alert>
            )}

            {/* 
              BOTÓN DE ENVÍO FINAL OCULTO: 
              La orden se procesa ahora exclusivamente desde el Carrito.
              Mantener este componente solo para visualización de los datos del solicitante.
            */}
            {/* 
            <Box sx={{ mt: 4 }}>
              <Button
                variant="contained"
                color="success"
                size="large"
                fullWidth
                startIcon={<SendIcon />}
                disabled={isSubmitting || !canSubmit}
                onClick={onSubmit}
                sx={{
                  py: 2,
                  fontSize: "1.1rem",
                  fontWeight: "800",
                  borderRadius: 3,
                  boxShadow: "0 6px 20px rgba(46, 125, 50, 0.3)",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  "&:hover": {
                    boxShadow: "0 8px 25px rgba(46, 125, 50, 0.4)",
                  },
                  "&.Mui-disabled": {
                    bgcolor: (theme) => alpha(theme.palette.action.disabledBackground, 0.1),
                    color: (theme) => theme.palette.action.disabled,
                  },
                }}
              >
                {isSubmitting ? "Enviando..." : !canSubmit ? "Completa los datos para enviar" : "Confirmar y Enviar Solicitud de Presupuesto"}
              </Button>
              <Typography variant="caption" sx={{ mt: 2, display: "block", textAlign: "center", fontStyle: "italic", opacity: 0.6 }}>
                Al hacer clic, se generará una orden formal con los datos mostrados arriba.
              </Typography>
            </Box> 
            */}
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};
