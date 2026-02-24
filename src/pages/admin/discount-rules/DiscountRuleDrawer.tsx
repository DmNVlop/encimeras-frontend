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
  Switch,
  FormControlLabel,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SaveIcon from "@mui/icons-material/Save";
import LocalActivityIcon from "@mui/icons-material/LocalActivity";
import TuneIcon from "@mui/icons-material/Tune";
import GavelIcon from "@mui/icons-material/Gavel";

import type { IDiscountRule } from "@/interfases/discount-rule.interfase";
import { DiscountType, DiscountScope, CollisionStrategy, CustomerStrategy } from "@/interfases/discount-rule.interfase";
import { updateDiscountRule, deleteDiscountRule, createDiscountRule } from "@/services/discount-rule.service";
import { get } from "@/services/api.service";
import type { Material } from "@/interfases/materials.interfase";
import type { ICustomer } from "@/interfases/customer.interfase";
import Autocomplete from "@mui/material/Autocomplete";

interface DiscountRuleDrawerProps {
  rule: IDiscountRule | null;
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
  isNew?: boolean;
}

const DiscountRuleDrawer: React.FC<DiscountRuleDrawerProps> = ({ rule, open, onClose, onRefresh, isNew = false }) => {
  const theme = useTheme();
  const [editing, setEditing] = useState(isNew);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<IDiscountRule>>({});

  // Data for selectors
  const [allMaterials, setAllMaterials] = useState<Material[]>([]);
  const [allCustomers, setAllCustomers] = useState<ICustomer[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      fetchSelectorData();
    }
  }, [open]);

  const fetchSelectorData = async () => {
    try {
      const [mats, custs] = await Promise.all([get<Material[]>("/materials"), get<ICustomer[]>("/customers")]);
      setAllMaterials(mats);
      setAllCustomers(custs);

      // Extract unique categories
      const uniqueCats = Array.from(new Set(mats.map((m) => m.category).filter(Boolean)));
      setCategories(uniqueCats);
    } catch (error) {
      console.error("Error fetching selector data:", error);
    }
  };

  useEffect(() => {
    if (rule) {
      setFormData(rule);
      setEditing(isNew);
    } else {
      setFormData({
        name: "",
        type: DiscountType.PERCENTAGE,
        value: 0,
        scope: DiscountScope.GLOBAL_TOTAL,
        priority: 0,
        collisionStrategy: CollisionStrategy.SUM,
        stackable: true,
        isActive: true,
        conditions: {
          customerStrategy: CustomerStrategy.ALL,
          targetCustomers: [],
          targetMaterials: [],
          targetCategories: [],
        },
      });
      setEditing(true);
    }
  }, [rule, isNew, open]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleConditionChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      conditions: { ...prev.conditions!, [field]: value },
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (isNew) {
        await createDiscountRule(formData as any);
      } else if (rule?._id) {
        await updateDiscountRule(rule._id, formData);
      }
      onRefresh();
      onClose();
    } catch (error) {
      console.error("Error saving rule:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!rule?._id) return;
    if (window.confirm("¿Estás seguro de que deseas desactivar esta regla?")) {
      setLoading(true);
      try {
        await deleteDiscountRule(rule._id);
        onRefresh();
        onClose();
      } catch (error) {
        console.error("Error deleting rule:", error);
      } finally {
        setLoading(false);
      }
    }
  };

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
            {isNew ? "Nueva Regla" : "Regla de Descuento"}
          </Typography>
          {!isNew && (
            <Chip label={formData.isActive ? "Activa" : "Pausada"} color={formData.isActive ? "success" : "default"} size="small" sx={{ fontWeight: 700 }} />
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
              sx={{ borderRadius: 2, fontWeight: 700, px: 3, backgroundColor: theme.palette.secondary.main }}
            >
              Guardar
            </Button>
          )}
          <IconButton onClick={onClose} sx={{ borderRadius: 2 }}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </Box>

      <Box sx={{ p: 4, overflowY: "auto", flexGrow: 1 }}>
        <Stack spacing={4}>
          {/* Section: Configuración Básica */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2, opacity: 0.6 }}>
              <LocalActivityIcon fontSize="small" />
              <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: 1 }}>
                Configuración Principal
              </Typography>
            </Stack>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Nombre de la Regla"
                  placeholder="Ej: Black Friday, Descuento Fidelidad..."
                  value={formData.name || ""}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  disabled={!editing || loading}
                  size="small"
                  required
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  select
                  label="Tipo de Descuento"
                  value={formData.type || DiscountType.PERCENTAGE}
                  onChange={(e) => handleInputChange("type", e.target.value)}
                  disabled={!editing || loading}
                  size="small"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                >
                  <MenuItem value={DiscountType.PERCENTAGE}>Porcentaje (%)</MenuItem>
                  <MenuItem value={DiscountType.FIXED_AMOUNT}>Importe Fijo (€)</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Valor"
                  value={formData.value || 0}
                  onChange={(e) => handleInputChange("value", Number(e.target.value))}
                  disabled={!editing || loading}
                  size="small"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  select
                  label="Alcance (Scope)"
                  value={formData.scope || DiscountScope.GLOBAL_TOTAL}
                  onChange={(e) => handleInputChange("scope", e.target.value)}
                  disabled={!editing || loading}
                  size="small"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                >
                  <MenuItem value={DiscountScope.GLOBAL_TOTAL}>Total del Pedido</MenuItem>
                  <MenuItem value={DiscountScope.SPECIFIC_MATERIALS}>Materiales Específicos</MenuItem>
                  <MenuItem value={DiscountScope.MATERIAL_CATEGORIES}>Categorías de Material</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Prioridad"
                  helperText="Mayor número se procesa antes"
                  value={formData.priority || 0}
                  onChange={(e) => handleInputChange("priority", Number(e.target.value))}
                  disabled={!editing || loading}
                  size="small"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                />
              </Grid>

              {/* Dynamic Selectors for scope */}
              {formData.scope === DiscountScope.SPECIFIC_MATERIALS && (
                <Grid size={{ xs: 12 }}>
                  <Autocomplete
                    multiple
                    options={allMaterials}
                    getOptionLabel={(option) => option.name}
                    value={allMaterials.filter((m) => formData.conditions?.targetMaterials?.includes(m._id))}
                    onChange={(_, newValue) =>
                      handleConditionChange(
                        "targetMaterials",
                        newValue.map((m) => m._id),
                      )
                    }
                    disabled={!editing || loading}
                    renderInput={(params) => (
                      <TextField {...params} label="Materiales Seleccionados" size="small" required sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }} />
                    )}
                  />
                </Grid>
              )}

              {formData.scope === DiscountScope.MATERIAL_CATEGORIES && (
                <Grid size={{ xs: 12 }}>
                  <Autocomplete
                    multiple
                    options={categories}
                    value={formData.conditions?.targetCategories || []}
                    onChange={(_, newValue) => handleConditionChange("targetCategories", newValue)}
                    disabled={!editing || loading}
                    renderInput={(params) => (
                      <TextField {...params} label="Categorías Seleccionadas" size="small" required sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }} />
                    )}
                  />
                </Grid>
              )}
            </Grid>
          </Box>

          <Divider sx={{ borderStyle: "dashed", opacity: 0.5 }} />

          {/* Section: Condiciones */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2, opacity: 0.6 }}>
              <TuneIcon fontSize="small" />
              <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: 1 }}>
                Condiciones de Activación
              </Typography>
            </Stack>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Fecha Inicio"
                  type="date"
                  value={formData.conditions?.startDate ? new Date(formData.conditions.startDate).toISOString().split("T")[0] : ""}
                  onChange={(e) => handleConditionChange("startDate", e.target.value)}
                  disabled={!editing || loading}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Fecha Fin"
                  type="date"
                  value={formData.conditions?.endDate ? new Date(formData.conditions.endDate).toISOString().split("T")[0] : ""}
                  onChange={(e) => handleConditionChange("endDate", e.target.value)}
                  disabled={!editing || loading}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  select
                  label="Segmentación de Clientes"
                  value={formData.conditions?.customerStrategy || CustomerStrategy.ALL}
                  onChange={(e) => handleConditionChange("customerStrategy", e.target.value)}
                  disabled={!editing || loading}
                  size="small"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                >
                  <MenuItem value={CustomerStrategy.ALL}>Todos los Clientes</MenuItem>
                  <MenuItem value={CustomerStrategy.SPECIFIC_CUSTOMERS}>Clientes Específicos</MenuItem>
                </TextField>
              </Grid>

              {formData.conditions?.customerStrategy === CustomerStrategy.SPECIFIC_CUSTOMERS && (
                <Grid size={{ xs: 12 }}>
                  <Autocomplete
                    multiple
                    options={allCustomers}
                    getOptionLabel={(option) => `${option.officialName} (${option.nif || "No NIF"})`}
                    value={allCustomers.filter((c) => formData.conditions?.targetCustomers?.includes(c._id!))}
                    onChange={(_, newValue) =>
                      handleConditionChange(
                        "targetCustomers",
                        newValue.map((c) => c._id!),
                      )
                    }
                    disabled={!editing || loading}
                    renderInput={(params) => (
                      <TextField {...params} label="Clientes Seleccionados" size="small" required sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }} />
                    )}
                  />
                </Grid>
              )}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Importe Mínimo Pedido (€)"
                  value={formData.conditions?.minOrderValue || 0}
                  onChange={(e) => handleConditionChange("minOrderValue", Number(e.target.value))}
                  disabled={!editing || loading}
                  size="small"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                />
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ borderStyle: "dashed", opacity: 0.5 }} />

          {/* Section: Estrategia de Colisión */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2, opacity: 0.6 }}>
              <GavelIcon fontSize="small" />
              <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: 1 }}>
                Lógica de Aplicación
              </Typography>
            </Stack>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  select
                  label="Estrategia de Colisión"
                  value={formData.collisionStrategy || CollisionStrategy.SUM}
                  onChange={(e) => handleInputChange("collisionStrategy", e.target.value)}
                  disabled={!editing || loading}
                  size="small"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                >
                  <MenuItem value={CollisionStrategy.SUM}>Sumar (A + B)</MenuItem>
                  <MenuItem value={CollisionStrategy.MAX}>Aplicar Mayor (Max)</MenuItem>
                  <MenuItem value={CollisionStrategy.MIN}>Aplicar Menor (Min)</MenuItem>
                  <MenuItem value={CollisionStrategy.CASCADE}>Cascada (Sucesivo)</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }} sx={{ display: "flex", alignItems: "center" }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.stackable || false}
                      onChange={(e) => handleInputChange("stackable", e.target.checked)}
                      disabled={!editing || loading}
                    />
                  }
                  label="Es acumulable con otras reglas"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive || false}
                      onChange={(e) => handleInputChange("isActive", e.target.checked)}
                      disabled={!editing || loading}
                      color="success"
                    />
                  }
                  label="Regla Activa"
                />
              </Grid>
            </Grid>
          </Box>
        </Stack>
      </Box>
    </Drawer>
  );
};

export default DiscountRuleDrawer;
