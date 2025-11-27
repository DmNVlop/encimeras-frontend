// src/components/admin/addons/AddonForm.tsx
import React from "react";
import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  OutlinedInput,
  Chip,
  Typography,
  Paper,
  type SelectChangeEvent,
  Divider,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import type { Addon } from "../../../interfases/addon.interfase";
import type { MeasurementRuleSet } from "../../../interfases/measurement-rule-set.interfase";
import { ImageUploader } from "../../public/common/ImageUploader/ImageUploader";
import { config } from "../../../config";

interface AddonFormProps {
  currentAddon: Partial<Addon>;
  isEditMode: boolean;
  ruleSets: MeasurementRuleSet[];
  attributeTypes: string[];
  materialCategories: string[]; // <--- Recibimos las categorías

  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  handleTextChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (event: SelectChangeEvent<string | string[]>) => void;
  handleDeleteChip: (field: keyof Addon, valueToDelete: string) => void;
}

const AddonForm: React.FC<AddonFormProps> = ({
  currentAddon,
  isEditMode,
  ruleSets,
  attributeTypes,
  materialCategories,
  handleSubmit,
  handleTextChange,
  handleSelectChange,
  handleDeleteChip,
}) => {
  // Opciones fijas para Required Measurements
  const measurementOptions = [
    { value: "quantity", label: "Cantidad (Unidades)" },
    { value: "length_ml", label: "Largo (ml)" },
    { value: "width_mm", label: "Ancho (mm)" },
    { value: "height_mm", label: "Alto (mm)" },
  ];

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {/* --- SECCIÓN 1: IDENTIFICACIÓN --- */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3, backgroundColor: "#fafafa" }}>
        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
          IDENTIFICACIÓN
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              required
              fullWidth
              label="Código (ID Único)"
              name="code"
              value={currentAddon.code || ""}
              onChange={handleTextChange}
              disabled={isEditMode}
              helperText="Ej: ENCASTRE_FREGADERO (Sin espacios)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              required
              fullWidth
              label="Nombre Comercial"
              name="name"
              value={currentAddon.name || ""}
              onChange={handleTextChange}
              helperText="Visible para el cliente"
            />
          </Grid>
        </Grid>
      </Paper>

      <TextField margin="normal" fullWidth name="description" label="Descripción" value={currentAddon.description || ""} onChange={handleTextChange} />

      {/* Contenedor para darle espaciado y etiqueta, ya que ImageUploader no tiene label interno como TextField */}
      <Box sx={{ mt: 2, mb: 1 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Imagen / Textura del Material
        </Typography>

        <ImageUploader
          // 1. Vinculación del valor (igual que antes)
          value={currentAddon.imageUrl}
          // 2. Manejo del Cambio (ADAPTADOR)
          onChange={(newUrl) => {
            // 1. Creamos un evento "sintético" (falso) que tiene la estructura exacta que tu función espera
            const syntheticEvent = {
              target: {
                name: "imageUrl", // El nombre del campo en tu estado
                value: newUrl, // El valor que nos da el Uploader
              },
            } as React.ChangeEvent<HTMLInputElement>;

            // 2. Llamamos a tu función original pasándole este evento falso
            handleTextChange(syntheticEvent);
          }}
          maxSizeMB={6}
          urlPrefix={config.assets.baseUrl}
        />
      </Box>

      {/* --- SECCIÓN 2: COMPORTAMIENTO EN EL WIZARD (NUEVO) --- */}
      <Typography variant="h6" gutterBottom sx={{ mt: 3, color: "primary.main" }}>
        Configuración Visual (Frontend Wizard)
      </Typography>
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          {/* 1. CATEGORÍA (Dónde aparece) */}
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth required>
              <InputLabel>Categoría Visual</InputLabel>
              <Select name="category" value={currentAddon.category || "OTRO"} onChange={handleSelectChange} label="Categoría Visual">
                <MenuItem value="TRABAJO">TRABAJO (Paso 3)</MenuItem>
                <MenuItem value="ENSAMBLAJE">ENSAMBLAJE (Paso 3)</MenuItem>
                <MenuItem value="COMPLEMENTO">COMPLEMENTO (Paso 4)</MenuItem>
                <MenuItem value="OTRO">OTRO (Oculto/Interno)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* 2. MEDIDAS REQUERIDAS (Qué inputs mostrar) */}
          <Grid size={{ xs: 12, sm: 8 }}>
            <FormControl fullWidth required>
              <InputLabel>Inputs Requeridos al Cliente</InputLabel>
              <Select
                name="requiredMeasurements"
                multiple
                value={currentAddon.requiredMeasurements || []}
                onChange={handleSelectChange}
                input={<OutlinedInput label="Inputs Requeridos al Cliente" />}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((val) => (
                      <Chip
                        key={val}
                        label={val}
                        size="small"
                        onDelete={() => handleDeleteChip("requiredMeasurements", val)}
                        onMouseDown={(e) => e.stopPropagation()}
                      />
                    ))}
                  </Box>
                )}
              >
                {measurementOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* 3. MATERIALES PERMITIDOS (Filtro de Seguridad) */}
          <Grid size={{ xs: 12 }}>
            <FormControl fullWidth required>
              <InputLabel>Materiales Compatibles</InputLabel>
              <Select
                name="allowedMaterialCategories"
                multiple
                value={currentAddon.allowedMaterialCategories || []}
                onChange={handleSelectChange}
                input={<OutlinedInput label="Materiales Compatibles" />}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((val) => (
                      <Chip
                        key={val}
                        label={val}
                        size="small"
                        color="primary"
                        onDelete={() => handleDeleteChip("allowedMaterialCategories", val)}
                        onMouseDown={(e) => e.stopPropagation()}
                      />
                    ))}
                  </Box>
                )}
              >
                {materialCategories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* --- SECCIÓN 3: MOTOR DE PRECIOS --- */}
      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        Motor de Precios (Backend)
      </Typography>
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth required>
              <InputLabel>Tipo de Cálculo</InputLabel>
              <Select name="pricingType" value={currentAddon.pricingType || "FIXED"} onChange={handleSelectChange} label="Tipo de Cálculo">
                <MenuItem value="FIXED">Precio Fijo (x Unidad)</MenuItem>
                <MenuItem value="RANGE_BASED">Por Rangos (Regla Medida)</MenuItem>
                <MenuItem value="COMBINATION_BASED">Por Combinación (Atributos)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              required
              fullWidth
              label="Mapeo Producto (productType)"
              name="productTypeMap"
              value={currentAddon.productTypeMap || ""}
              onChange={handleTextChange}
              helperText="Link a price-configs"
            />
          </Grid>

          {/* CONDICIONALES */}
          {currentAddon.pricingType === "RANGE_BASED" && (
            <>
              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1 }}>Configuración de Rangos</Divider>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Regla de Medición</InputLabel>
                  <Select name="measurementRuleSetId" value={currentAddon.measurementRuleSetId || ""} onChange={handleSelectChange} label="Regla de Medición">
                    <MenuItem value="">
                      <em>Ninguna</em>
                    </MenuItem>
                    {ruleSets.map((r) => (
                      <MenuItem key={r._id} value={r._id}>
                        {r.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Heredar Atributos</InputLabel>
                  <Select
                    name="inheritedAttributes"
                    multiple
                    value={currentAddon.inheritedAttributes || []}
                    onChange={handleSelectChange}
                    input={<OutlinedInput label="Heredar Atributos" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {selected.map((val) => (
                          <Chip
                            key={val}
                            label={val}
                            size="small"
                            onDelete={() => handleDeleteChip("inheritedAttributes", val)}
                            onMouseDown={(e) => e.stopPropagation()}
                          />
                        ))}
                      </Box>
                    )}
                  >
                    {attributeTypes.map((t) => (
                      <MenuItem key={t} value={t}>
                        {t}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}
        </Grid>
      </Paper>

      <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 2 }}>
        {isEditMode ? "Guardar Cambios" : "Crear Addon"}
      </Button>
    </Box>
  );
};

export default AddonForm;
