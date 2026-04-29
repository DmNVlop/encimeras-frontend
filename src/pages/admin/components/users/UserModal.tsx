// src/pages/admin/components/users/UserModal.tsx
import React, { useState, useEffect } from "react";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  FormHelperText,
  Alert,
} from "@mui/material";
import { Role, type User } from "@/interfases/user.interfase";
import { useAuth } from "@/context/AuthProvider";
import { getManagerUsers, getOwnerUsers } from "@/services/user.service";

const modalStyle = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 500,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

interface UserModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<User>) => Promise<void>;
  user?: Partial<User>;
  isEditMode: boolean;
}

const UserModal: React.FC<UserModalProps> = ({ open, onClose, onSubmit, user, isEditMode }) => {
  const { user: currentUser } = useAuth();
  const [formData, setFormData] = useState<Partial<User>>({});
  const [password, setPassword] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [managersList, setManagersList] = useState<User[]>([]);
  const [ownersList, setOwnersList] = useState<User[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState<string>("");
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>("");

  const isOwner = currentUser?.roles.includes("OWNER");
  const isManager = currentUser?.roles.includes("MANAGER");
  const isAdmin = currentUser?.roles.includes("ADMIN");

  const availableRoles = isAdmin
    ? Object.values(Role)
    : isOwner
      ? [Role.MANAGER, Role.SALES, Role.WORKER, Role.USER]
      : isManager
        ? [Role.SALES, Role.WORKER, Role.USER]
        : [Role.USER];

  const autoFactoryId = currentUser?.factoryId;

  // ADMIN u OWNER crean SALES → deben seleccionar MANAGER
  // ADMIN edita SALES → puede cambiar MANAGER
  const showManagerSelector = (isAdmin || isOwner) && roles.includes(Role.SALES) && (!isEditMode || isAdmin);
  // MANAGER crea SALES → se auto-asigna (no muestra selector)
  const managerAutoAssigned = isManager && roles.includes(Role.SALES) && !isEditMode;
  // ADMIN crea MANAGER → debe seleccionar OWNER
  // ADMIN edita MANAGER → puede cambiar OWNER
  const showOwnerSelector = isAdmin && roles.includes(Role.MANAGER) && !roles.includes(Role.OWNER) && (!isEditMode || isAdmin);

  useEffect(() => {
    if (open) {
      if (isEditMode && user) {
        setFormData(user);
        setRoles(user.roles || [Role.USER]);
        setPassword("");
        setSelectedManagerId(user.managerId || "");
        setSelectedOwnerId(user.ownerId || "");
      } else {
        setFormData({ username: "", name: "", email: "", phone: "", factoryId: autoFactoryId });
        setRoles([Role.USER]);
        setPassword("");
        setSelectedManagerId("");
        setSelectedOwnerId("");
      }

      if (isAdmin || isOwner) {
        loadManagers();
      }
      if (isAdmin) {
        loadOwners();
      }
    }
  }, [open, isEditMode, user, autoFactoryId, isAdmin, isOwner]);

  const loadManagers = async () => {
    try {
      const managers = await getManagerUsers();
      setManagersList(managers);
    } catch (error) {
      console.error("Error loading managers:", error);
    }
  };

  const loadOwners = async () => {
    try {
      const owners = await getOwnerUsers();
      setOwnersList(owners);
    } catch (error) {
      console.error("Error loading owners:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRolesChange = (event: any) => {
    const { target: { value } } = event;
    setRoles(typeof value === "string" ? (value.split(",") as Role[]) : value);
    setSelectedManagerId("");
    setSelectedOwnerId("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((isAdmin || isOwner) && roles.includes(Role.SALES) && !selectedManagerId) {
      alert("Debes seleccionar un Manager para el usuario SALES");
      return;
    }

    if (isAdmin && roles.includes(Role.MANAGER) && !roles.includes(Role.OWNER) && !selectedOwnerId) {
      alert("Debes seleccionar un Owner para el usuario MANAGER");
      return;
    }

    const submissionData: any = {
      ...formData,
      roles,
    };

    if (password) {
      submissionData.password = password;
    }

    if (autoFactoryId) {
      submissionData.factoryId = autoFactoryId;
    }

    if ((isAdmin || isOwner) && roles.includes(Role.SALES) && selectedManagerId) {
      submissionData.managerId = selectedManagerId;
    }

    if (isAdmin && roles.includes(Role.MANAGER) && !roles.includes(Role.OWNER) && selectedOwnerId) {
      submissionData.ownerId = selectedOwnerId;
    }

    await onSubmit(submissionData);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle} component="form" onSubmit={handleSubmit}>
        <Typography variant="h6" mb={2}>
          {isEditMode ? "Editar Usuario" : "Crear Nuevo Usuario"}
        </Typography>

        <TextField
          margin="normal"
          required
          fullWidth
          label="Username (Login)"
          name="username"
          value={formData.username || ""}
          onChange={handleChange}
          disabled={isEditMode}
          error={!!formData.username && formData.username.includes(" ")}
          helperText={formData.username && formData.username.includes(" ") ? "No se permiten espacios" : ""}
        />

        <TextField
          margin="normal"
          required={!isEditMode}
          fullWidth
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          helperText={isEditMode ? "Dejar en blanco para mantener la actual" : "Mínimo 6 caracteres"}
          inputProps={{ minLength: 6 }}
        />

        <TextField margin="normal" fullWidth label="Nombre Real" name="name" value={formData.name || ""} onChange={handleChange} />

        <TextField margin="normal" fullWidth label="Email" name="email" type="email" value={formData.email || ""} onChange={handleChange} />

        <TextField margin="normal" fullWidth label="Teléfono" name="phone" value={formData.phone || ""} onChange={handleChange} />

        {(isOwner || isManager) && !isEditMode && (
          <Alert severity="info" sx={{ mt: 1, mb: 1 }}>
            Los usuarios creados heredarán automáticamente el factoryId de tu cuenta.
          </Alert>
        )}

        <FormControl fullWidth margin="normal" required>
          <InputLabel id="roles-label">Roles</InputLabel>
          <Select
            labelId="roles-label"
            multiple
            value={roles}
            onChange={handleRolesChange}
            input={<OutlinedInput label="Roles" />}
            renderValue={(selected) => selected.join(", ")}
          >
            {availableRoles.map((role) => (
              <MenuItem key={role} value={role}>
                <Checkbox checked={roles.indexOf(role) > -1} />
                <ListItemText primary={role} />
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>Al menos un rol es requerido</FormHelperText>
        </FormControl>

        {/* Selector de MANAGER para ADMIN/OWNER creando SALES */}
        {showManagerSelector && (
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Manager Asignado</InputLabel>
            <Select
              value={selectedManagerId}
              onChange={(e) => setSelectedManagerId(e.target.value)}
              label="Manager Asignado"
            >
              {managersList.length === 0 ? (
                <MenuItem disabled value="">Sin managers disponibles</MenuItem>
              ) : (
                managersList.map((manager) => (
                  <MenuItem key={manager._id} value={manager._id}>
                    {manager.name || manager.username} (@{manager.username})
                  </MenuItem>
                ))
              )}
            </Select>
            <FormHelperText>Selecciona el Manager que gestionará este usuario SALES</FormHelperText>
          </FormControl>
        )}

        {showManagerSelector && (
          <Alert severity={selectedManagerId ? "success" : "warning"} sx={{ mt: 1 }}>
            {selectedManagerId
              ? "SALES será asignado al Manager seleccionado"
              : "Debes seleccionar un Manager para este usuario SALES"}
          </Alert>
        )}

        {/* Selector de OWNER para ADMIN creando MANAGER */}
        {showOwnerSelector && (
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Owner Asignado</InputLabel>
            <Select
              value={selectedOwnerId}
              onChange={(e) => setSelectedOwnerId(e.target.value)}
              label="Owner Asignado"
            >
              {ownersList.length === 0 ? (
                <MenuItem disabled value="">Sin owners disponibles</MenuItem>
              ) : (
                ownersList.map((owner) => (
                  <MenuItem key={owner._id} value={owner._id}>
                    {owner.name || owner.username} (@{owner.username})
                  </MenuItem>
                ))
              )}
            </Select>
            <FormHelperText>Selecciona el Owner al que pertenecerá este Manager</FormHelperText>
          </FormControl>
        )}

        {showOwnerSelector && (
          <Alert severity={selectedOwnerId ? "success" : "warning"} sx={{ mt: 1 }}>
            {selectedOwnerId
              ? "MANAGER será asignado al Owner seleccionado"
              : "Debes seleccionar un Owner para este usuario MANAGER"}
          </Alert>
        )}

        {managerAutoAssigned && (
          <Alert severity="success" sx={{ mt: 1 }}>
            Este usuario SALES quedará bajo tu gestión automáticamente
          </Alert>
        )}

        <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
          <Button fullWidth variant="outlined" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={
              roles.length === 0 ||
              (!isEditMode && !password) ||
              (showManagerSelector && !isEditMode && !selectedManagerId) ||
              (showOwnerSelector && !isEditMode && !selectedOwnerId)
            }
          >
            Guardar
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default UserModal;
