// src/components/admin/materials/DatosGeneralesForm.tsx
import React from "react";
import { config } from "@/config";

import {
  Box,
  Typography,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  OutlinedInput,
  Chip,
  type SelectChangeEvent,
  Paper,
  IconButton,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import CloseIcon from "@mui/icons-material/Close";
import type { Material } from "@/interfases/materials.interfase";
import type { AttributesBundle } from "@/pages/admin/materials/MaterialEditModal";
import { ImageUploader } from "@/pages/public/common/ImageUploader/ImageUploader";

// --- Props que el formulario necesita para funcionar ---
interface DatosGeneralesFormProps {
  currentMaterial: Partial<Material>;
  attributes: AttributesBundle;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  handleTextChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (event: SelectChangeEvent<string | string[]>) => void;
  handleDeleteChip: (field: keyof Material, valueToDelete: string) => void;
  handleSwitchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleAddRecipe: () => void;
  handleRemoveRecipe: (index: number) => void;
  handleRecipeChange: (index: number, field: string, value: string | string[]) => void;
}

const DatosGeneralesForm: React.FC<DatosGeneralesFormProps> = ({
  currentMaterial,
  attributes,
  handleSubmit,
  handleTextChange,
  handleSelectChange,
  handleDeleteChip,
  handleSwitchChange,
  handleAddRecipe,
  handleRemoveRecipe,
  handleRecipeChange,
}) => {
  return (
    // El formulario ahora usa la función handleSubmit recibida por props
    <Box component="form" id="material-form" onSubmit={handleSubmit}>
      <TextField margin="normal" required fullWidth name="name" label="Nombre" value={currentMaterial.name || ""} onChange={handleTextChange} />
      <TextField margin="normal" fullWidth name="ref" label="Referencia" value={currentMaterial.ref || ""} onChange={handleTextChange} />
      <TextField margin="normal" fullWidth name="description" label="Descripción" value={currentMaterial.description || ""} onChange={handleTextChange} />
      {/* Contenedor para darle espaciado y etiqueta, ya que ImageUploader no tiene label interno como TextField */}
      <Box sx={{ mt: 2, mb: 1 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Imagen / Textura del Material
        </Typography>

        <ImageUploader
          // 1. Vinculación del valor (igual que antes)
          value={currentMaterial.imageUrl}
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

      <FormControl fullWidth margin="normal" title="Categoria (MAT_CATEGORIA)" required>
        <InputLabel>Categoría</InputLabel>
        <Select name="category" value={currentMaterial.category || ""} onChange={handleSelectChange} label="Categoría">
          {attributes.categories.map((c) => (
            <MenuItem key={c._id} value={c.value}>
              {c.label || c.value}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth margin="normal" title="Tipo (MAT_TIPO)" required>
        <InputLabel>Tipo</InputLabel>
        <Select name="type" value={currentMaterial.type || ""} onChange={handleSelectChange} label="Tipo">
          {attributes.matTypes.map((t) => (
            <MenuItem key={t._id} value={t.value}>
              {t.label || t.value}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: "bold" }}>
        Recetas de Precio
      </Typography>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        {(currentMaterial.pricingRecipes || []).map((recipe, index) => (
          <Box key={index} sx={{ p: 2, mb: 2, border: "1px solid #ddd", borderRadius: 1, position: "relative" }}>
            {/* Botón de Eliminar Receta */}
            <IconButton onClick={() => handleRemoveRecipe(index)} size="small" sx={{ position: "absolute", top: 8, right: 8 }}>
              <CloseIcon fontSize="small" />
            </IconButton>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Tipo de Producto (ej. ENCIMERA, COPETE)"
                  name="productType"
                  value={recipe.productType}
                  onChange={(e) => handleRecipeChange(index, "productType", e.target.value)}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Unidad</InputLabel>
                  <Select name="unit" value={recipe.unit} label="Unidad" onChange={(e) => handleRecipeChange(index, "unit", e.target.value)}>
                    <MenuItem value="m2">m2 (Metros Cuadrados)</MenuItem>
                    <MenuItem value="ml">ml (Metros Lineales)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Atributos de esta Receta</InputLabel>
                  <Select
                    multiple
                    name="pricingAttributes"
                    value={recipe.pricingAttributes}
                    onChange={(e) => handleRecipeChange(index, "pricingAttributes", e.target.value as string[])}
                    input={<OutlinedInput label="Atributos de esta Receta" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {/* Usamos la misma lista de atributos que ya cargaba el modal */}
                    {attributes.pricingAttributeTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        ))}

        <Button onClick={handleAddRecipe} variant="outlined" size="small">
          + Añadir Receta de Precio
        </Button>
      </Paper>

      <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: "bold" }}>
        Configuración del Presupuestador (Step 1)
      </Typography>

      <FormControl fullWidth margin="normal">
        <InputLabel>Atributos Seleccionables</InputLabel>
        <Select
          name="selectableAttributes"
          multiple
          title="Atributos Seleccionables (Step 1). Estos serán los atributos que escogerá el usuario en el precio en el presupuestador."
          value={currentMaterial.selectableAttributes || []}
          onChange={handleSelectChange}
          input={<OutlinedInput label="Atributos que definen el precio" />}
          renderValue={(selected) => (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {selected.map((value) => (
                <Chip
                  key={value}
                  label={value}
                  onDelete={() => handleDeleteChip("selectableAttributes", value)}
                  onMouseDown={(event) => event.stopPropagation()}
                />
              ))}
            </Box>
          )}
        >
          {attributes.pricingAttributeTypes.map((type) => (
            <MenuItem key={type} value={type}>
              {type}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControlLabel control={<Switch checked={currentMaterial.isActive ?? true} name="isActive" onChange={handleSwitchChange} />} label="Activo" />

      <Button type="submit" fullWidth variant="contained" sx={{ mt: 3 }}>
        Guardar Cambios
      </Button>
    </Box>
  );
};

export default DatosGeneralesForm;
