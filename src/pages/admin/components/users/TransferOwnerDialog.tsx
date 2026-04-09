// src/pages/admin/components/users/TransferOwnerDialog.tsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import type { User } from "@/interfases/user.interfase";
import { getOwnerUsers, transferOwner, batchTransferOwner } from "@/services/user.service";
import type { BatchTransferResponse } from "@/interfases/transfer-owner.dto";
import { Role } from "@/interfases/user.interfase";

interface TransferOwnerDialogProps {
  open: boolean;
  onClose: () => void;
  userIds: string[];
  users: User[];
  onTransferComplete: () => void;
}

const TransferOwnerDialog: React.FC<TransferOwnerDialogProps> = ({ open, onClose, userIds, users, onTransferComplete }) => {
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>("");
  const [ownerUsers, setOwnerUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtrar solo usuarios SALES válidos para transferencia
  const salesUsers = users.filter((u) => userIds.includes(u._id) && u.roles.includes(Role.SALES));
  const invalidUsers = userIds.length - salesUsers.length;

  useEffect(() => {
    if (open) {
      setSelectedOwnerId("");
      setError(null);
      loadOwners();
    }
  }, [open]);

  const loadOwners = async () => {
    try {
      const owners = await getOwnerUsers();
      setOwnerUsers(owners);
    } catch (error) {
      console.error("Error loading owners:", error);
      setError("Error al cargar la lista de OWNERs");
    }
  };

  const handleTransfer = async () => {
    if (!selectedOwnerId) return;

    setLoading(true);
    setError(null);

    try {
      if (userIds.length === 1) {
        // Transferencia individual
        await transferOwner(userIds[0], { newOwnerId: selectedOwnerId });
      } else {
        // Transferencia masiva
        const result: BatchTransferResponse = await batchTransferOwner({
          userIds,
          newOwnerId: selectedOwnerId,
        });

        if (result.failed.length > 0) {
          setError(`${result.failed.length} usuario(s) no pudieron ser transferidos`);
        }
      }

      onTransferComplete();
      onClose();
    } catch (err: any) {
      console.error("Error transferring users:", err);
      setError(err.message || "Error al transferir usuarios");
    } finally {
      setLoading(false);
    }
  };

  const selectedOwner = ownerUsers.find((o) => o._id === selectedOwnerId);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <SwapHorizIcon color="primary" />
          <Typography variant="h6">Transferir Usuarios</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Advertencia si hay usuarios no válidos */}
        {invalidUsers > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {invalidUsers} usuario(s) seleccionado(s) no son SALES y serán ignorados
          </Alert>
        )}

        {/* Lista de usuarios a transferir */}
        {salesUsers.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Usuarios a transferir ({salesUsers.length}):
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, maxHeight: 150, overflow: "auto", p: 1, bgcolor: "background.default", borderRadius: 1 }}>
              {salesUsers.map((user) => {
                const currentOwner = users.find((u) => u._id === user.ownerId);
                return (
                  <Chip
                    key={user._id}
                    label={`${user.name || user.username}`}
                    size="small"
                    variant="outlined"
                    avatar={<Avatar sx={{ width: 20, height: 20 }}>{user.name?.[0] || user.username[0]}</Avatar>}
                    title={`Owner actual: ${currentOwner?.name || currentOwner?.username || "Sin owner"}`}
                  />
                );
              })}
            </Box>
          </Box>
        )}

        {/* Selector de nuevo OWNER */}
        <FormControl fullWidth required sx={{ mb: 2 }}>
          <InputLabel>Nuevo OWNER Gestor</InputLabel>
          <Select value={selectedOwnerId} onChange={(e) => setSelectedOwnerId(e.target.value)} label="Nuevo OWNER Gestor" disabled={loading}>
            {ownerUsers.map((owner) => (
              <MenuItem key={owner._id} value={owner._id}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Avatar sx={{ width: 24, height: 24 }}>{owner.name?.[0] || owner.username[0]}</Avatar>
                  <Box>
                    <Typography variant="body2">{owner.name || owner.username}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Factory: {owner.factoryId || "N/A"}
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Preview de cambios */}
        {selectedOwner && salesUsers.length > 0 && (
          <Box sx={{ mt: 2, p: 2, bgcolor: "background.default", borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Resumen de cambios:
            </Typography>
            {salesUsers.slice(0, 3).map((user) => {
              const currentOwner = users.find((u) => u._id === user.ownerId);
              return (
                <Box key={user._id} sx={{ display: "flex", alignItems: "center", gap: 2, py: 0.5 }}>
                  <PersonIcon fontSize="small" />
                  <Typography variant="body2">{user.name || user.username}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {currentOwner?.username || "Sin owner"} → {selectedOwner.username}
                  </Typography>
                </Box>
              );
            })}
            {salesUsers.length > 3 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                ...y {salesUsers.length - 3} usuario(s) más
              </Typography>
            )}
          </Box>
        )}

        {/* Mensajes de error */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleTransfer}
          disabled={!selectedOwnerId || loading || salesUsers.length === 0}
          startIcon={loading ? <CircularProgress size={20} /> : <SwapHorizIcon />}
        >
          {loading ? "Transferiendo..." : `Transferir (${salesUsers.length})`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransferOwnerDialog;
