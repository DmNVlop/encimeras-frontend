import React, { useRef, useState } from "react";
import {
  Box,
  Typography,
  Stack,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  alpha,
  useTheme,
  Skeleton,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import BrokenImageOutlinedIcon from "@mui/icons-material/BrokenImageOutlined";
import AdminPageTitle from "../components/AdminPageTitle";
import { factorySettingsService } from "@/services/factory-settings.service";
import { useAuth } from "@/context/AuthProvider";
import { useFactorySettings } from "@/context/FactorySettingsContext";

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

const FactorySettingsPage: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { settings, logoUrl, loading, setSettings } = useFactorySettings();

  const canEdit = user?.roles.some((r) => r === "ADMIN" || r === "OWNER") ?? false;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" | "warning" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnack = (message: string, severity: "success" | "error" | "warning") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be re-selected
    e.target.value = "";

    if (!ACCEPTED_TYPES.includes(file.type)) {
      showSnack("Formato no válido. Usa PNG, JPG o WEBP.", "warning");
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      showSnack(`El archivo supera el límite de ${MAX_FILE_SIZE_MB}MB.`, "warning");
      return;
    }

    setUploading(true);
    try {
      const updated = await factorySettingsService.uploadLogo(file);
      setSettings(updated);
      showSnack("Logo actualizado correctamente.", "success");
    } catch {
      showSnack("Error al subir el logo. Inténtalo de nuevo.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    setConfirmOpen(false);
    setDeleting(true);
    try {
      const updated = await factorySettingsService.deleteLogo();
      setSettings(updated);
      showSnack("Logo eliminado. Se usará el logo por defecto.", "success");
    } catch {
      showSnack("Error al eliminar el logo.", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box sx={{ pb: 8 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "flex-end" }}
        sx={{ mb: 5 }}
        spacing={3}
      >
        <Box>
          <AdminPageTitle>Configuración de Fábrica</AdminPageTitle>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1, opacity: 0.8 }}>
            Personaliza la identidad visual de tu fábrica en la plataforma.
          </Typography>
        </Box>
      </Stack>

      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          maxWidth: 700,
        }}
      >
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
          Logotipo de la empresa
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Este logo aparecerá en el encabezado del panel y en los documentos generados.
          Formatos admitidos: PNG, JPG, WEBP. Máximo {MAX_FILE_SIZE_MB}MB.
        </Typography>

        {/* Logo preview area */}
        <Box
          sx={{
            width: "100%",
            height: 160,
            borderRadius: 2,
            border: `1.5px dashed ${alpha(theme.palette.divider, 0.8)}`,
            bgcolor: alpha(theme.palette.action.hover, 0.3),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 3,
            overflow: "hidden",
            position: "relative",
          }}
        >
          {loading ? (
            <Skeleton variant="rectangular" width="100%" height="100%" />
          ) : logoUrl ? (
            <Box
              component="img"
              src={logoUrl}
              alt="Logo de la fábrica"
              sx={{
                maxHeight: 120,
                maxWidth: "80%",
                objectFit: "contain",
              }}
            />
          ) : (
            <Stack alignItems="center" spacing={1} sx={{ color: "text.disabled" }}>
              <BrokenImageOutlinedIcon sx={{ fontSize: 40, opacity: 0.4 }} />
              <Typography variant="body2" sx={{ opacity: 0.6 }}>
                Sin logo configurado
              </Typography>
            </Stack>
          )}
        </Box>

        {/* Actions */}
        {canEdit ? (
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(",")}
              style={{ display: "none" }}
              onChange={handleFileSelect}
            />
            <Button
              variant="contained"
              color="primary"
              startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <CloudUploadIcon />}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || deleting}
              sx={{
                borderRadius: 3,
                fontWeight: 700,
                px: 3,
                py: 1.2,
                textTransform: "none",
                fontSize: "0.9rem",
                boxShadow: `0 6px 14px -4px ${alpha(theme.palette.primary.main, 0.4)}`,
              }}
            >
              {uploading ? "Subiendo..." : logoUrl ? "Cambiar logo" : "Subir logo"}
            </Button>

            {logoUrl && (
              <Button
                variant="outlined"
                color="error"
                startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlineIcon />}
                onClick={() => setConfirmOpen(true)}
                disabled={uploading || deleting}
                sx={{
                  borderRadius: 3,
                  fontWeight: 600,
                  px: 3,
                  py: 1.2,
                  textTransform: "none",
                  fontSize: "0.9rem",
                }}
              >
                {deleting ? "Eliminando..." : "Eliminar logo"}
              </Button>
            )}
          </Stack>
        ) : (
          <Alert severity="info">
            Solo los usuarios con rol ADMIN u OWNER pueden modificar el logo.
          </Alert>
        )}

        {settings?.updatedAt && (
          <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 3 }}>
            Última actualización: {new Date(settings.updatedAt).toLocaleString("es-ES")}
          </Typography>
        )}
      </Paper>

      {/* Delete confirmation dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>¿Eliminar logo?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Se eliminará el logo actual y la plataforma usará el logo por defecto. Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmOpen(false)} sx={{ textTransform: "none" }}>
            Cancelar
          </Button>
          <Button onClick={handleDeleteConfirmed} color="error" variant="contained" sx={{ textTransform: "none", fontWeight: 700 }}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

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

export default FactorySettingsPage;
