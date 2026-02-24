import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, CircularProgress } from "@mui/material";
import { Add } from "@mui/icons-material";

interface ResetQuoteDialogProps {
  open: boolean;
  onClose: () => void;
  onReset: () => void;
  onUpdate?: () => void;
  onSaveAsCopy?: () => void;
  isSaving: boolean;
  currentDraftId: string | null;
  hasContent: boolean;
}

export const ResetQuoteDialog: React.FC<ResetQuoteDialogProps> = ({ open, onClose, onReset, onUpdate, onSaveAsCopy, isSaving, currentDraftId, hasContent }) => {
  return (
    <Dialog open={open} onClose={() => !isSaving && onClose()} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: 1 }}>
        <Add color="primary" />
        Nuevo Presupuesto
      </DialogTitle>
      <DialogContent>
        <DialogContentText>¿Estás seguro de que deseas iniciar un nuevo presupuesto? Se perderán los datos actuales no guardados.</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1, flexDirection: "column" }}>
        <Button fullWidth variant="contained" color="primary" onClick={onReset} disabled={isSaving} sx={{ py: 1.5 }}>
          Nuevo (Comenzar de cero)
        </Button>

        {/* Botón Actualizar (Solo si ya existe un documento previo) */}
        {currentDraftId && onUpdate && (
          <Button
            fullWidth
            variant="outlined"
            color="success"
            onClick={onUpdate}
            disabled={isSaving || !hasContent}
            startIcon={isSaving ? <CircularProgress size={20} /> : null}
            sx={{ py: 1.5 }}
          >
            {isSaving ? "Actualizando..." : "Actualizar Borrador y Nuevo"}
          </Button>
        )}

        {/* Botón Guardar Copia */}
        {onSaveAsCopy && (
          <Button
            fullWidth
            variant="outlined"
            color="primary"
            onClick={onSaveAsCopy}
            disabled={isSaving || !hasContent}
            startIcon={isSaving ? <CircularProgress size={20} /> : null}
            sx={{ py: 1.5 }}
          >
            {isSaving ? "Guardando..." : currentDraftId ? "Guardar como copia y Nuevo" : "Guardar Borrador y Nuevo"}
          </Button>
        )}

        <Button fullWidth variant="text" color="inherit" onClick={onClose} disabled={isSaving} sx={{ py: 1 }}>
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
