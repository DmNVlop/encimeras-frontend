import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Divider } from "@mui/material";
import { ShoppingCart as CartIcon, Save as SaveIcon, DeleteForever as DeleteIcon } from "@mui/icons-material";

interface CartLoadConflictDialogProps {
  open: boolean;
  onClose: () => void;
  onAction: (action: "SAVE_TO_CART" | "SAVE_AS_DRAFT" | "DISCARD") => Promise<void> | void;
  isProcessing: boolean;
}

export const CartLoadConflictDialog: React.FC<CartLoadConflictDialogProps> = ({ open, onClose, onAction, isProcessing }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: "bold" }}>Diseño en curso</DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          Tienes un diseño de encimera en ejecución. ¿Qué te gustaría hacer con él antes de cargar el nuevo presupuesto?
        </Typography>
        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <Button
            variant="outlined"
            startIcon={<CartIcon />}
            onClick={() => onAction("SAVE_TO_CART")}
            disabled={isProcessing}
            fullWidth
            sx={{ justifyContent: "flex-start", py: 1.5, borderRadius: 2 }}
          >
            <Box sx={{ textAlign: "left" }}>
              <Typography variant="subtitle2" fontWeight="bold">
                Añadir al carrito
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Guardar el diseño actual en el carrito para seguir luego.
              </Typography>
            </Box>
          </Button>

          <Button
            variant="outlined"
            startIcon={<SaveIcon />}
            onClick={() => onAction("SAVE_AS_DRAFT")}
            disabled={isProcessing}
            fullWidth
            sx={{ justifyContent: "flex-start", py: 1.5, borderRadius: 2 }}
          >
            <Box sx={{ textAlign: "left" }}>
              <Typography variant="subtitle2" fontWeight="bold">
                Guardar como borrador
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Guardar en tu panel de borradores.
              </Typography>
            </Box>
          </Button>

          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => onAction("DISCARD")}
            disabled={isProcessing}
            fullWidth
            sx={{ justifyContent: "flex-start", py: 1.5, borderRadius: 2 }}
          >
            <Box sx={{ textAlign: "left" }}>
              <Typography variant="subtitle2" fontWeight="bold">
                Descartar cambios
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Perderás el diseño actual y cargarás el nuevo.
              </Typography>
            </Box>
          </Button>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={isProcessing}>
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
