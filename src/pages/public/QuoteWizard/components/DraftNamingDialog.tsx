import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, Typography, TextField, Box, Button, CircularProgress } from "@mui/material";
import { Save as SaveIcon } from "@mui/icons-material";

interface DraftNamingDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
  isSaving: boolean;
  initialName?: string;
  title?: string;
  subtitle?: string;
}

export const DraftNamingDialog: React.FC<DraftNamingDialogProps> = ({
  open,
  onClose,
  onConfirm,
  isSaving,
  initialName = "",
  title = "Guardar Presupuesto",
  subtitle = "Asigna un nombre a este presupuesto para identificarlo fácilmente.",
}) => {
  const [tempName, setTempName] = useState(initialName);

  useEffect(() => {
    if (open) {
      setTempName(initialName);
    }
  }, [open, initialName]);

  const handleConfirm = () => {
    if (tempName.trim()) {
      onConfirm(tempName);
    }
  };

  return (
    <Dialog open={open} onClose={() => !isSaving && onClose()} maxWidth="xs" fullWidth sx={{ "& .MuiDialog-paper": { px: 2 } }}>
      <DialogTitle sx={{ fontWeight: "bold", textAlign: "center", pt: 3 }}>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: "center" }}>
          {subtitle}
        </Typography>
        <TextField
          fullWidth
          autoFocus
          label="Nombre del presupuesto"
          placeholder="Ej: Mi Cocina, Proyecto Reforma..."
          value={tempName}
          onChange={(e) => setTempName(e.target.value)}
          variant="outlined"
          disabled={isSaving}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
            },
          }}
          onKeyPress={(e) => {
            if (e.key === "Enter" && tempName.trim() && !isSaving) {
              handleConfirm();
            }
          }}
        />
      </DialogContent>
      <Box sx={{ p: 3, pt: 0, display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Button
          variant="contained"
          fullWidth
          size="large"
          disabled={!tempName.trim() || isSaving}
          onClick={handleConfirm}
          startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          sx={{ py: 1.5, borderRadius: 2 }}
        >
          {isSaving ? "Guardando..." : "Confirmar y Guardar"}
        </Button>
        <Button variant="text" fullWidth color="inherit" onClick={onClose} disabled={isSaving}>
          Cancelar
        </Button>
      </Box>
    </Dialog>
  );
};
