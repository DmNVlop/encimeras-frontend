import React, { useEffect, useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField } from "@mui/material";

interface OrderStatusNoteDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  busy?: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
}

/** Pide la nota obligatoria de rechazar, cancelar o deshacer (el portal muestra la de rechazo/cancelación al cliente). */
export const OrderStatusNoteDialog: React.FC<OrderStatusNoteDialogProps> = ({ open, title, description, confirmLabel, destructive, busy, onClose, onConfirm }) => {
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) setNote("");
  }, [open]);

  const trimmed = note.trim();

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pb: 1 }}>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText variant="body2" sx={{ mb: 1.5 }}>
          {description}
        </DialogContentText>
        <TextField
          autoFocus
          fullWidth
          multiline
          minRows={3}
          size="small"
          label="Motivo (obligatorio)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          inputProps={{ maxLength: 1000 }}
          helperText={`${note.length}/1000`}
        />
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button size="small" onClick={onClose} disabled={busy}>
          Volver
        </Button>
        <Button size="small" variant="contained" color={destructive ? "error" : "primary"} disabled={!trimmed || busy} onClick={() => onConfirm(trimmed)}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrderStatusNoteDialog;
