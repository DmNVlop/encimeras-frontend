import React from "react";
import { Dialog, DialogTitle, DialogContent, Typography, Box, Button } from "@mui/material";
import { Info as InfoIcon, ShoppingCart as CartIcon } from "@mui/icons-material";

interface GroupLoaderDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (clearFirst: boolean) => void;
  groupName?: string;
  hasItemsInCart?: boolean;
}

export const GroupLoaderDialog: React.FC<GroupLoaderDialogProps> = ({ open, onClose, onConfirm, groupName = "un conjunto", hasItemsInCart = false }) => {
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

        {hasItemsInCart && (
          <Box sx={{ mb: 2, p: 1.5, bgcolor: "warning.lighter", borderRadius: 1, border: "1px solid", borderColor: "warning.main" }}>
            <Typography variant="body2" color="warning.dark" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <strong>Aviso:</strong> Tienes elementos en tu carrito.
            </Typography>
          </Box>
        )}

        <Typography variant="body2" color="text.secondary">
          ¿Deseas cargar también el resto de elementos de este grupo en tu carrito para realizar un pedido conjunto?
        </Typography>

        <Box sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 1.5 }}>
          {hasItemsInCart && (
            <Button
              variant="contained"
              color="warning"
              fullWidth
              size="large"
              startIcon={<CartIcon />}
              onClick={() => {
                onConfirm(true);
                onClose();
              }}
              sx={{ py: 1.5, borderRadius: 2 }}
            >
              Vaciar carrito y cargar grupo
            </Button>
          )}

          <Button
            variant="contained"
            fullWidth
            size="large"
            startIcon={<CartIcon />}
            onClick={() => {
              onConfirm(false);
              onClose();
            }}
            sx={{ py: 1.5, borderRadius: 2 }}
          >
            {hasItemsInCart ? "Combinar con el carrito actual" : "Sí, cargar grupo en el carrito"}
          </Button>

          <Button variant="outlined" fullWidth onClick={onClose} sx={{ py: 1.2, borderRadius: 2 }}>
            Solo cargar este presupuesto
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
