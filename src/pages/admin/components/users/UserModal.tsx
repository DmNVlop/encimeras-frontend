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
import { getOwnerUsers } from "@/services/user.service";

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
  const [ownersList, setOwnersList] = useState<User[]>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>("");

  const isOwner = currentUser?.roles.includes("OWNER");
  const isManager = currentUser?.roles.includes("MANAGER");
  const isAdmin = currentUser?.roles.includes("ADMIN");

  // Roles disponibles según jerarquía del usuario actual
  const availableRoles = isAdmin
    ? Object.values(Role)
    : isOwner
      ? [Role.MANAGER, Role.SALES, Role.WORKER, Role.USER]
      : isManager
        ? [Role.SALES, Role.WORKER, Role.USER]
        : [Role.USER];

  const autoFactoryId = currentUser?.factoryId;
  const showOwnerSelector = isAdmin && roles.includes(Role.SALES) && !isEditMode;

  useEffect(() => {
    if (open) {
      if (isEditMode && user) {
        setFormData(user);
        setRoles(user.roles || [Role.USER]);
        setPassword(""); // No enviamos contraseña de vuelta
        setSelectedOwnerId(user.ownerId || "");
      } else {
        setFormData({ username: "", name: "", email: "", phone: "", factoryId: autoFactoryId });
        setRoles([Role.USER]);
        setPassword("");
        setSelectedOwnerId("");
      }

      // Cargar lista de OWNERs si es ADMIN creando SALES
      if (isAdmin && !isEditMode) {
        loadOwners();
      }
    }
  }, [open, isEditMode, user, autoFactoryId, isAdmin]);

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
    const {
      target: { value },
    } = event;
    setRoles(typeof value === "string" ? (value.split(",") as Role[]) : value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación: ADMIN creando SALES requiere ownerId
    if (isAdmin && roles.includes(Role.SALES) && !selectedOwnerId && !isEditMode) {
      alert("Debes seleccionar un OWNER gestor para usuarios SALES");
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

    // Si es ADMIN creando SALES, incluir ownerId
    if (isAdmin && roles.includes(Role.SALES) && selectedOwnerId) {
      submissionData.ownerId = selectedOwnerId;
    }

    await onSubmit(submissionData);
    onClose();
  };

  const allRoles = availableRoles;

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
          disabled={isEditMode} // Username suele ser inmutable en muchos sistemas
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
            {allRoles.map((role) => (
              <MenuItem key={role} value={role}>
                <Checkbox checked={roles.indexOf(role) > -1} />
                <ListItemText primary={role} />
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>Al menos un rol es requerido</FormHelperText>
        </FormControl>

        {/* Selector de OWNER para ADMIN creando SALES */}
        {showOwnerSelector && (
          <FormControl fullWidth margin="normal" required>
            <InputLabel>OWNER Gestor</InputLabel>
            <Select value={selectedOwnerId} onChange={(e) => setSelectedOwnerId(e.target.value)} label="OWNER Gestor">
              {ownersList.map((owner) => (
                <MenuItem key={owner._id} value={owner._id}>
                  {owner.name || owner.username} ({owner.username})
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>Selecciona el OWNER que gestionará este usuario SALES</FormHelperText>
          </FormControl>
        )}

        {/* Alertas informativas */}
        {isAdmin && roles.includes(Role.SALES) && !isEditMode && (
          <Alert severity="info" sx={{ mt: 1 }}>
            {selectedOwnerId ? "Usuario SALES será asignado al OWNER seleccionado" : "Debes seleccionar un OWNER gestor para usuarios SALES"}
          </Alert>
        )}

        {(isOwner || isManager) && roles.includes(Role.SALES) && !isEditMode && (
          <Alert severity="success" sx={{ mt: 1 }}>
            Este usuario SALES será gestionado automáticamente por tu cuenta
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
            disabled={roles.length === 0 || (!isEditMode && !password) || (isAdmin && roles.includes(Role.SALES) && !selectedOwnerId && !isEditMode)}
          >
            Guardar
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default UserModal;
