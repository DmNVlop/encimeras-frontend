import React, { useState, useEffect } from "react";
import { Drawer, Box, Typography, Stack, IconButton, Button, Chip, TextField, Divider, useTheme, alpha, Grid, MenuItem, CircularProgress } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SaveIcon from "@mui/icons-material/Save";
import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ContactMailIcon from "@mui/icons-material/ContactMail";

import type { ICustomer } from "@/interfases/customer.interfase";
import { CustomerType } from "@/interfases/customer.interfase";
import { updateCustomer, deleteCustomer, createCustomer } from "@/services/customer.service";

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

  useEffect(() => {
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

  const handleSave = async () => {
    setLoading(true);
    try {
      if (isNew) {
        await createCustomer(formData as any);
      } else if (customer?._id) {
        await updateCustomer(customer._id, formData);
      }
      onRefresh();
      onClose();
    } catch (error) {
      console.error("Error saving customer:", error);
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

  const isCompany = formData.type === CustomerType.COMPANY;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 550, md: 700 },
          borderRadius: { xs: 0, sm: "24px 0 0 24px" },
          overflow: "hidden",
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
        </Stack>
      </Box>
    </Drawer>
  );
};

export default CustomerDrawer;
