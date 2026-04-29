// src/pages/admin/components/users/AssignManagerDialog.tsx
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
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import PersonIcon from "@mui/icons-material/Person";
import type { User } from "@/interfases/user.interfase";
import { Role } from "@/interfases/user.interfase";
import { getManagerUsers, transferManager, batchTransferManager } from "@/services/user.service";
import type { BatchTransferResponse } from "@/interfases/transfer-owner.dto";

interface AssignManagerDialogProps {
  open: boolean;
  onClose: () => void;
  userIds: string[];
  users: User[];
  allUsers: User[];
  onTransferComplete: () => void;
}

const AssignManagerDialog: React.FC<AssignManagerDialogProps> = ({ open, onClose, userIds, users, allUsers, onTransferComplete }) => {
  const [selectedManagerId, setSelectedManagerId] = useState<string>("");
  const [managerUsers, setManagerUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const salesUsers = users.filter((u) => userIds.includes(u._id) && u.roles.includes(Role.SALES));
  const invalidUsers = userIds.length - salesUsers.length;

  useEffect(() => {
    if (open) {
      setSelectedManagerId("");
      setError(null);
      loadManagers();
    }
  }, [open]);

  const loadManagers = async () => {
    try {
      const managers = await getManagerUsers();
      setManagerUsers(managers);
    } catch {
      setError("Error al cargar la lista de Managers");
    }
  };

  const handleAssign = async () => {
    if (!selectedManagerId) return;

    setLoading(true);
    setError(null);

    try {
      if (salesUsers.length === 1) {
        await transferManager(salesUsers[0]._id, { newManagerId: selectedManagerId });
      } else {
        const result: BatchTransferResponse = await batchTransferManager({
          userIds: salesUsers.map((u) => u._id),
          newManagerId: selectedManagerId,
        });
        if (result.failed.length > 0) {
          setError(`${result.failed.length} usuario(s) no pudieron ser asignados`);
        }
      }

      onTransferComplete();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al asignar Manager");
    } finally {
      setLoading(false);
    }
  };

  const selectedManager = managerUsers.find((m) => m._id === selectedManagerId);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ManageAccountsIcon color="primary" />
          <Typography variant="h6">Asignar Manager</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {invalidUsers > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {invalidUsers} usuario(s) seleccionado(s) no son SALES y serán ignorados
          </Alert>
        )}

        {salesUsers.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Usuarios a reasignar ({salesUsers.length}):
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, maxHeight: 150, overflow: "auto", p: 1, bgcolor: "background.default", borderRadius: 1 }}>
              {salesUsers.map((user) => {
                const currentManager = allUsers.find((u) => u._id === user.managerId);
                return (
                  <Chip
                    key={user._id}
                    label={user.name || user.username}
                    size="small"
                    variant="outlined"
                    avatar={<Avatar sx={{ width: 20, height: 20 }}>{user.name?.[0] || user.username[0]}</Avatar>}
                    title={`Manager actual: ${currentManager?.name || currentManager?.username || "Sin manager"}`}
                  />
                );
              })}
            </Box>
          </Box>
        )}

        <FormControl fullWidth required sx={{ mb: 2 }}>
          <InputLabel>Nuevo Manager</InputLabel>
          <Select value={selectedManagerId} onChange={(e) => setSelectedManagerId(e.target.value)} label="Nuevo Manager" disabled={loading}>
            {managerUsers.map((manager) => (
              <MenuItem key={manager._id} value={manager._id}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Avatar sx={{ width: 24, height: 24 }}>{manager.name?.[0] || manager.username[0]}</Avatar>
                  <Box>
                    <Typography variant="body2">{manager.name || manager.username}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      @{manager.username}
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedManager && salesUsers.length > 0 && (
          <Box sx={{ mt: 2, p: 2, bgcolor: "background.default", borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Resumen de cambios:
            </Typography>
            {salesUsers.slice(0, 3).map((user) => {
              const currentManager = allUsers.find((u) => u._id === user.managerId);
              return (
                <Box key={user._id} sx={{ display: "flex", alignItems: "center", gap: 2, py: 0.5 }}>
                  <PersonIcon fontSize="small" />
                  <Typography variant="body2">{user.name || user.username}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {currentManager?.name || currentManager?.username || "Sin manager"} → {selectedManager.name || selectedManager.username}
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
          onClick={handleAssign}
          disabled={!selectedManagerId || loading || salesUsers.length === 0}
          startIcon={loading ? <CircularProgress size={20} /> : <ManageAccountsIcon />}
        >
          {loading ? "Asignando..." : `Asignar Manager (${salesUsers.length})`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignManagerDialog;
