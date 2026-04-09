import React, { useState, useEffect } from "react";
import {
  Drawer,
  Box,
  Typography,
  Stack,
  IconButton,
  Button,
  Chip,
  TextField,
  Divider,
  useTheme,
  alpha,
  Grid,
  MenuItem,
  CircularProgress,
  Alert,
  Snackbar,
  Autocomplete,
  Paper,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SaveIcon from "@mui/icons-material/Save";
import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ContactMailIcon from "@mui/icons-material/ContactMail";
import LinkIcon from "@mui/icons-material/Link";
import PersonAddIcon from "@mui/icons-material/PersonAdd";

import type { ICustomer } from "@/interfases/customer.interfase";
import { CustomerType } from "@/interfases/customer.interfase";
import type { User } from "@/interfases/user.interfase";
import { updateCustomer, deleteCustomer, createCustomer, linkCustomerToUser, getPlatformUsers } from "@/services/customer.service";

interface CustomerDrawerProps {
  customer: ICustomer | null;
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
  isNew?: boolean;
}

const CustomerDrawer: React.FC<CustomerDrawerProps> = ({ customer, open, onClose, onRefresh, isNew = false }) => {
  const theme = useTheme();
  const [editing, setEditing] = useState(isNew);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<ICustomer>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Estado para vinculación de usuario
  const [platformUsers, setPlatformUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [linking, setLinking] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    const loadPlatformUsers = async () => {
      try {
        const users = await getPlatformUsers();
        setPlatformUsers(users);

        // Si el cliente ya tiene un usuario vinculado, seleccionarlo
        if (customer?.platformUserId) {
          const linkedUser = users.find((u) => u._id === customer.platformUserId);
          setSelectedUser(linkedUser || null);
        }
      } catch (error) {
        console.error("Error loading platform users:", error);
        setSnackbar({
          open: true,
          message: "Error al cargar usuarios de la plataforma",
          severity: "error",
        });
      }
    };

    if (open && !isNew) {
      loadPlatformUsers();
    }

    if (customer) {
      setFormData(customer);
      setEditing(isNew);
    } else {
      setFormData({
        type: CustomerType.INDIVIDUAL,
        officialName: "",
        contact: {},
        address: {},
        isActive: true,
      });
      setEditing(true);
    }
  }, [customer, isNew, open]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleContactChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      contact: { ...prev.contact, [field]: value },
    }));
  };

  const handleAddressChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validar tipo de cliente
    if (!formData.type) {
      errors.type = "El tipo de cliente es requerido";
    }

    // Validar según tipo
    if (formData.type === CustomerType.COMPANY) {
      if (!formData.officialName?.trim()) {
        errors.officialName = "La razón social es requerida para empresas";
      }
    } else if (formData.type === CustomerType.INDIVIDUAL) {
      if (!formData.firstName?.trim()) {
        errors.firstName = "El nombre es requerido para particulares";
      }
      if (!formData.lastName?.trim()) {
        errors.lastName = "Los apellidos son requeridos para particulares";
      }
    }

    // Validar NIF si se proporciona
    if (formData.nif && !/^[A-Z0-9]{9}$/.test(formData.nif.toUpperCase())) {
      errors.nif = "Formato de NIF/CIF/DNI inválido";
    }

    // Validar email si se proporciona
    if (formData.contact?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact.email)) {
      errors.email = "Formato de email inválido";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    // Validar formulario primero
    if (!validateForm()) {
      setSnackbar({
        open: true,
        message: "Por favor corrige los errores en el formulario",
        severity: "error",
      });
      return;
    }

    setLoading(true);
    try {
      if (isNew) {
        await createCustomer(formData as any);
        setSnackbar({
          open: true,
          message: "Cliente creado exitosamente",
          severity: "success",
        });
      } else if (customer?._id) {
        await updateCustomer(customer._id, formData);
        setSnackbar({
          open: true,
          message: "Cliente actualizado exitosamente",
          severity: "success",
        });
      }
      onRefresh();
      onClose();
    } catch (error: any) {
      console.error("Error saving customer:", error);

      // Mejorar mensajes de error según el tipo
      let errorMessage = "Error al guardar el cliente";
      if (error.response?.status === 400) {
        errorMessage = "Datos inválidos enviados al servidor";
      } else if (error.response?.status === 409) {
        errorMessage = "Ya existe un cliente con ese NIF o email";
      } else if (error.response?.status === 403) {
        errorMessage = "No tienes permisos para realizar esta acción";
      } else if (error.response?.status === 500) {
        errorMessage = "Error interno del servidor";
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!customer?._id) return;
    if (window.confirm("¿Estás seguro de que deseas desactivar este cliente?")) {
      setLoading(true);
      try {
        await deleteCustomer(customer._id);
        onRefresh();
        onClose();
      } catch (error) {
        console.error("Error deleting customer:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLinkUser = async () => {
    if (!customer?._id || !selectedUser?._id) return;

    setLinking(true);
    try {
      await linkCustomerToUser(customer._id, selectedUser._id);

      // Actualizar el cliente localmente
      setFormData((prev) => ({ ...prev, platformUserId: selectedUser._id }));

      setSnackbar({
        open: true,
        message: `Cliente vinculado exitosamente al usuario ${selectedUser.name || selectedUser.username}`,
        severity: "success",
      });

      // Refrescar datos
      onRefresh();
    } catch (error) {
      console.error("Error linking customer to user:", error);
      setSnackbar({
        open: true,
        message: "Error al vincular cliente con usuario",
        severity: "error",
      });
    } finally {
      setLinking(false);
    }
  };

  const handleUnlinkUser = async () => {
    if (!customer?._id) return;

    setLinking(true);
    try {
      await linkCustomerToUser(customer._id, "");

      // Actualizar el cliente localmente
      setFormData((prev) => ({ ...prev, platformUserId: undefined }));
      setSelectedUser(null);

      setSnackbar({
        open: true,
        message: "Vinculación eliminada exitosamente",
        severity: "success",
      });

      // Refrescar datos
      onRefresh();
    } catch (error) {
      console.error("Error unlinking customer from user:", error);
      setSnackbar({
        open: true,
        message: "Error al eliminar vinculación",
        severity: "error",
      });
    } finally {
      setLinking(false);
    }
  };

  const isCompany = formData.type === CustomerType.COMPANY;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        zIndex: (theme) => theme.zIndex.modal,
      }}
      slotProps={{
        paper: {
          sx: {
            width: { xs: "100%", sm: 550, md: 700 },
            borderRadius: { xs: 0, sm: "24px 0 0 24px" },
            overflow: "hidden",
          },
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 3,
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: alpha(theme.palette.background.default, 0.5),
          backdropFilter: "blur(10px)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            {isNew ? "Nuevo Cliente" : "Ficha de Cliente"}
          </Typography>
          {!isNew && (
            <Chip
              icon={isCompany ? <BusinessIcon sx={{ fontSize: "1rem !important" }} /> : <PersonIcon sx={{ fontSize: "1rem !important" }} />}
              label={isCompany ? "Empresa" : "Particular"}
              size="small"
              sx={{
                fontWeight: 700,
                backgroundColor: isCompany ? alpha(theme.palette.primary.main, 0.1) : alpha(theme.palette.success.main, 0.1),
                color: isCompany ? theme.palette.primary.main : theme.palette.success.main,
              }}
            />
          )}
        </Stack>

        <Stack direction="row" spacing={1}>
          {!isNew && !editing && (
            <>
              <Button variant="outlined" startIcon={<EditIcon />} onClick={() => setEditing(true)} sx={{ borderRadius: 2, fontWeight: 700 }}>
                Editar
              </Button>
              <IconButton color="error" onClick={handleDelete} sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.error.main, 0.2)}` }}>
                <DeleteOutlineIcon />
              </IconButton>
            </>
          )}
          {editing && (
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              onClick={handleSave}
              disabled={loading}
              sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}
            >
              Guardar
            </Button>
          )}
          <IconButton onClick={onClose} sx={{ borderRadius: 2 }}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </Box>

      {/* Content */}
      <Box sx={{ p: 4, overflowY: "auto", flexGrow: 1 }}>
        <Stack spacing={4}>
          {/* Section: Identificación */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2, opacity: 0.6 }}>
              <AssignmentIndIcon fontSize="small" />
              <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: 1 }}>
                Identificación Legal
              </Typography>
            </Stack>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  select
                  label="Tipo de Cliente"
                  value={formData.type || CustomerType.INDIVIDUAL}
                  onChange={(e) => handleInputChange("type", e.target.value)}
                  disabled={!editing || loading}
                  size="small"
                  error={!!formErrors.type}
                  helperText={formErrors.type}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                >
                  <MenuItem value={CustomerType.INDIVIDUAL}>Particular / Autónomo</MenuItem>
                  <MenuItem value={CustomerType.COMPANY}>Empresa / S.L.</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="CIF / NIF / DNI"
                  value={formData.nif || ""}
                  onChange={(e) => handleInputChange("nif", e.target.value)}
                  disabled={!editing || loading}
                  size="small"
                  error={!!formErrors.nif}
                  helperText={formErrors.nif}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                />
              </Grid>
              {isCompany ? (
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Razón Social"
                    value={formData.officialName || ""}
                    onChange={(e) => handleInputChange("officialName", e.target.value)}
                    disabled={!editing || loading}
                    size="small"
                    error={!!formErrors.officialName}
                    helperText={formErrors.officialName}
                    required
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                  />
                </Grid>
              ) : (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Nombre"
                      value={formData.firstName || ""}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      disabled={!editing || loading}
                      size="small"
                      error={!!formErrors.firstName}
                      helperText={formErrors.firstName}
                      required
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Apellidos"
                      value={formData.lastName || ""}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      disabled={!editing || loading}
                      size="small"
                      error={!!formErrors.lastName}
                      helperText={formErrors.lastName}
                      required
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                    />
                  </Grid>
                </>
              )}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Nombre Comercial / Apodo"
                  value={formData.commercialName || ""}
                  onChange={(e) => handleInputChange("commercialName", e.target.value)}
                  disabled={!editing || loading}
                  size="small"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                />
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ borderStyle: "dashed", opacity: 0.5 }} />

          {/* Section: Localización */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2, opacity: 0.6 }}>
              <LocationOnIcon fontSize="small" />
              <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: 1 }}>
                Localización de Entrega
              </Typography>
            </Stack>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Dirección"
                  value={formData.address?.addressLine1 || ""}
                  onChange={(e) => handleAddressChange("addressLine1", e.target.value)}
                  disabled={!editing || loading}
                  size="small"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  fullWidth
                  label="Población / Ciudad"
                  value={formData.address?.city || ""}
                  onChange={(e) => handleAddressChange("city", e.target.value)}
                  disabled={!editing || loading}
                  size="small"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="CP"
                  value={formData.address?.cp || ""}
                  onChange={(e) => handleAddressChange("cp", e.target.value)}
                  disabled={!editing || loading}
                  size="small"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Provincia / Región"
                  value={formData.address?.region || ""}
                  onChange={(e) => handleAddressChange("region", e.target.value)}
                  disabled={!editing || loading}
                  size="small"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                />
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ borderStyle: "dashed", opacity: 0.5 }} />

          {/* Section: Contacto */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2, opacity: 0.6 }}>
              <ContactMailIcon fontSize="small" />
              <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: 1 }}>
                Contacto Directo
              </Typography>
            </Stack>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Email Corporativo"
                  value={formData.contact?.email || ""}
                  onChange={(e) => handleContactChange("email", e.target.value)}
                  disabled={!editing || loading}
                  size="small"
                  type="email"
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Teléfono"
                  value={formData.contact?.phone || ""}
                  onChange={(e) => handleContactChange("phone", e.target.value)}
                  disabled={!editing || loading}
                  size="small"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Notas / Descripción"
                  multiline
                  rows={3}
                  value={formData.description || ""}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  disabled={!editing || loading}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Section: Vinculación a Usuario de Plataforma */}
          {!isNew && !editing && (
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2, opacity: 0.6 }}>
                <LinkIcon fontSize="small" />
                <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: 1 }}>
                  Vinculación a Plataforma
                </Typography>
              </Stack>

              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  background: alpha(theme.palette.background.default, 0.3),
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Vincula este cliente a un usuario de la plataforma para permitir acceso B2B.
                </Typography>

                {formData.platformUserId ? (
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                      <Chip icon={<PersonAddIcon />} label="Vinculado" color="success" variant="outlined" sx={{ fontWeight: 700 }} />
                      <Typography variant="body2">
                        Usuario: <strong>{selectedUser?.name || selectedUser?.username || "Desconocido"}</strong>
                      </Typography>
                    </Stack>
                    <Button variant="outlined" color="error" size="small" onClick={handleUnlinkUser} disabled={linking} sx={{ fontWeight: 700 }}>
                      {linking ? <CircularProgress size={20} /> : "Eliminar Vinculación"}
                    </Button>
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    <Autocomplete
                      options={platformUsers}
                      getOptionLabel={(user) => `${user.name || user.username} (${user.email})`}
                      value={selectedUser}
                      onChange={(_, newValue) => setSelectedUser(newValue)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Seleccionar Usuario de Plataforma"
                          size="small"
                          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                        />
                      )}
                      disabled={linking}
                    />
                    <Button
                      variant="contained"
                      startIcon={linking ? <CircularProgress size={20} color="inherit" /> : <LinkIcon />}
                      onClick={handleLinkUser}
                      disabled={!selectedUser || linking}
                      sx={{ fontWeight: 700, borderRadius: 2 }}
                    >
                      Vincular Usuario
                    </Button>
                  </Stack>
                )}
              </Paper>
            </Box>
          )}
        </Stack>
      </Box>

      {/* Snackbar para mensajes de vinculación */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ fontWeight: 700, borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Drawer>
  );
};

export default CustomerDrawer;
