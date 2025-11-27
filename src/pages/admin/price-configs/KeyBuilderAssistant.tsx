// src/components/admin/price-configs/KeyBuilderAssistant.tsx
import React, { useState } from "react";
import { Box, Typography, Button, FormControl, InputLabel, Select, MenuItem, IconButton, Paper } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";

// --- INTERFACES NECESARIAS ---
// Estas interfaces deben coincidir con las que usas en el padre

// El estado interno del constructor
interface PriceRuleAttribute {
  type: string;
  value: string;
}

// Lo que esperamos de la API de /attributes
interface AttributeToConfigPrice {
  _id: string;
  type: string;
  value: string;
  label?: string;
}

// --- PROPS DEL COMPONENTE ---
interface KeyBuilderAssistantProps {
  // Datos que vienen del padre (PriceConfigsPage)
  allAttributeTypes: string[];
  attributeValuesCache: Record<string, AttributeToConfigPrice[]>;
  loadAttributeValues: (type: string) => Promise<void>; // Para cargar valores dinámicamente

  // Callback para devolver la clave construida al padre
  onConfirmKey: (key: string) => void;
}

// =============================================================================
// COMPONENTE KeyBuilderAssistant
// =============================================================================
export const KeyBuilderAssistant: React.FC<KeyBuilderAssistantProps> = ({ allAttributeTypes, attributeValuesCache, loadAttributeValues, onConfirmKey }) => {
  // --- ESTADO INTERNO ---
  // Este estado solo vive dentro del asistente
  const [attributes, setAttributes] = useState<PriceRuleAttribute[]>([{ type: "", value: "" }]);

  // --- LÓGICA DE GESTIÓN DE ATRIBUTOS (Portado de PriceConfigsPage) ---

  const handleAddAttributeRow = () => {
    setAttributes((prev) => [...prev, { type: "", value: "" }]);
  };

  const handleRemoveAttributeRow = (index: number) => {
    setAttributes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAttributeChange = (index: number, field: "type" | "value", newValue: string) => {
    const updated = [...attributes];
    updated[index][field] = newValue;

    // Si cambiamos el tipo, reseteamos el valor y cargamos los nuevos
    if (field === "type") {
      updated[index].value = "";
      loadAttributeValues(newValue); // Llama a la prop del padre
    }
    setAttributes(updated);
  };

  // --- LÓGICA DE CONFIRMACIÓN (El nuevo "Submit") ---

  const handleConfirm = () => {
    // 1. Construir la clave
    const keyString = attributes
      .filter((attr) => attr.type && attr.value) // Ignorar filas vacías
      .sort((a, b) => a.type.localeCompare(b.type)) // ¡CRÍTICO! Ordenar alfabéticamente para claves consistentes
      .map((attr) => `${attr.type}:${attr.value}`) // Convertir a string "TIPO:VALOR"
      .join("||"); // Unir con el separador

    // 2. Devolver la clave al padre
    onConfirmKey(keyString);
  };

  // --- RENDERIZADO ---

  return (
    <Paper variant="outlined" sx={{ p: 2, mt: 2, mb: 1, bgcolor: "grey.50" }}>
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: "bold" }}>
        Asistente de Clave de Combinación
      </Typography>

      {/* --- Constructor de Atributos (Tu JSX original) --- */}
      {attributes.map((attr, index) => (
        <Box key={index} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel>Atributo</InputLabel>
            <Select value={attr.type} label="Atributo" onChange={(e) => handleAttributeChange(index, "type", e.target.value)}>
              {allAttributeTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ flex: 1 }} size="small">
            <InputLabel>Valor</InputLabel>
            <Select
              value={attr.value}
              label="Valor"
              disabled={!attr.type} // Deshabilitado si no hay tipo
              onChange={(e) => handleAttributeChange(index, "value", e.target.value)}>
              {(attributeValuesCache[attr.type] || []).map((val) => (
                <MenuItem key={val._id} value={val.value}>
                  {val.label || val.value}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <IconButton onClick={() => handleRemoveAttributeRow(index)} color="error" size="small">
            <RemoveCircleOutlineIcon />
          </IconButton>
        </Box>
      ))}

      {/* --- Acciones del Asistente --- */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
        <Button variant="text" size="small" onClick={handleAddAttributeRow} startIcon={<AddIcon />}>
          Añadir Atributo
        </Button>

        <Button onClick={handleConfirm} variant="contained" color="success">
          Usar esta Clave
        </Button>
      </Box>
    </Paper>
  );
};
