import React, { useState, useEffect, useCallback } from "react";
import { Box, Typography, Stack, Button, TextField, useTheme, alpha, Paper, CircularProgress, Alert, Snackbar } from "@mui/material";
import { useNavigate } from "react-router-dom";
import SaveIcon from "@mui/icons-material/Save";
import AdminPageTitle from "../components/AdminPageTitle";
import { documentSettingsService, type IDocumentSettings } from "@/services/document-settings.service";
import { useAuth } from "@/context/AuthProvider";

const DEFAULT_VALIDITY_DAYS = 30;
const DEFAULT_FOOTER_TEXT =
  "Presupuesto válido por 30 días desde su emisión. Pasado este plazo será necesaria una nueva validación de precios y condiciones. Validez 30 días.";

const DocConfigPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = user?.roles.includes("ADMIN");
  const canView = user?.roles.includes("ADMIN") || user?.roles.includes("OWNER");

  // Redirect if no access
  useEffect(() => {
    if (!canView) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [canView, navigate]);

  const [settings, setSettings] = useState<IDocumentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [validityDays, setValidityDays] = useState<number>(DEFAULT_VALIDITY_DAYS);
  const [footerText, setFooterText] = useState<string>(DEFAULT_FOOTER_TEXT);

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await documentSettingsService.getSettings();
      if (data) {
        setSettings(data);
        setValidityDays(data.validityDays);
        setFooterText(data.footerText);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (settings?._id) {
        await documentSettingsService.updateSettings(settings._id, { validityDays, footerText });
      } else {
        const created = await documentSettingsService.createSettings({ validityDays, footerText, userId: null });
        setSettings(created);
      }
      setSnackbar({ open: true, message: "Configuración guardada correctamente", severity: "success" });
    } catch (error) {
      console.error("Error saving settings:", error);
      setSnackbar({ open: true, message: "Error al guardar la configuración", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 8 }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "flex-end" }} sx={{ mb: 5 }} spacing={3}>
        <Box>
          <AdminPageTitle>Configuración de Documentos</AdminPageTitle>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1, opacity: 0.8 }}>
            Configura los parámetros de validez y el texto informativo de los documentos PDF.
          </Typography>
        </Box>
      </Stack>

      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          maxWidth: 800,
        }}
      >
        <Stack spacing={4}>
          <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Validez del Presupuesto
            </Typography>
            <TextField
              label="Días de validez"
              type="number"
              value={validityDays}
              onChange={(e) => setValidityDays(Math.max(1, parseInt(e.target.value) || 1))}
              disabled={!canEdit}
              inputProps={{ min: 1 }}
              helperText="Número de días que el presupuesto permanece válido desde su emisión"
              sx={{ width: 250 }}
            />
          </Box>

          <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Texto Informativo del Cliente
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Este texto aparecerá en el pie (footer) del documento PDF del presupuesto.
            </Typography>
            <TextField
              label="Texto del footer"
              multiline
              rows={4}
              fullWidth
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              disabled={!canEdit}
              placeholder="Escribe el texto informativo que aparecerá en el pie del PDF..."
            />
          </Box>

          {canEdit && (
            <Box sx={{ pt: 2 }}>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={saving}
                sx={{
                  borderRadius: 3,
                  fontWeight: 800,
                  px: 4,
                  py: 1.5,
                  boxShadow: `0 8px 16px -4px ${alpha(theme.palette.secondary.main, 0.4)}`,
                  textTransform: "none",
                  fontSize: "1rem",
                }}
              >
                {saving ? "Guardando..." : "Guardar Configuración"}
              </Button>
            </Box>
          )}

          {!canEdit && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Solo los usuarios con rol ADMIN pueden modificar esta configuración.
            </Alert>
          )}
        </Stack>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DocConfigPage;
