import React from "react";
import { Dialog, DialogTitle, DialogContent, Typography, Box, Button } from "@mui/material";
import { Info as InfoIcon, ShoppingCart as CartIcon } from "@mui/icons-material";

interface GroupLoaderDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  groupName?: string;
}

export const GroupLoaderDialog: React.FC<GroupLoaderDialogProps> = ({ open, onClose, onConfirm, groupName = "un conjunto" }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
        <InfoIcon color="primary" />
        <Typography variant="h6" fontWeight="bold">
          Presupuesto Grupal
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Este presupuesto es parte de <strong>{groupName}</strong>.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          ¿Deseas cargar también el resto de elementos de este grupo en tu carrito para realizar un pedido conjunto?
        </Typography>

        <Box sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Button
            variant="contained"
            fullWidth
            size="large"
            startIcon={<CartIcon />}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            sx={{ py: 1.5, borderRadius: 2 }}
          >
            Sí, cargar grupo en el carrito
          </Button>
          <Button variant="outlined" fullWidth onClick={onClose} sx={{ py: 1.2, borderRadius: 2 }}>
            Solo cargar este presupuesto
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
