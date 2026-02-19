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
} from "@mui/material";
import { Role, type User } from "@/interfases/user.interfase";

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
  const [formData, setFormData] = useState<Partial<User>>({});
  const [password, setPassword] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    if (open) {
      if (isEditMode && user) {
        setFormData(user);
        setRoles(user.roles || [Role.USER]);
        setPassword(""); // No enviamos contraseña de vuelta
      } else {
        setFormData({ username: "", name: "", email: "", phone: "" });
        setRoles([Role.USER]);
        setPassword("");
      }
    }
  }, [open, isEditMode, user]);

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
    const submissionData: any = {
      ...formData,
      roles,
    };

    if (password) {
      submissionData.password = password;
    }

    await onSubmit(submissionData);
    onClose();
  };

  const allRoles = Object.values(Role);

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

        <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
          <Button fullWidth variant="outlined" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" fullWidth variant="contained" disabled={roles.length === 0 || (!isEditMode && !password)}>
            Guardar
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default UserModal;
