// src/components/admin/materials/CombinacionesValidasTab.tsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
} from "@mui/material";
import { get, create, update, remove } from "../../../services/apiService";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import type { Attribute } from "../../../interfases/attribute.interfase";

// --- Interfaces específicas para este componente ---
interface ValidCombination {
  _id: string;
  materialId: string;
  attributes: Record<string, string>;
}

interface CombinationRuleAttribute {
  type: string;
  value: string;
}

interface CombinacionesValidasTabProps {
  materialId: string | undefined;
}

const CombinacionesValidasTab: React.FC<CombinacionesValidasTabProps> = ({ materialId }) => {
  const [validCombinations, setValidCombinations] = useState<ValidCombination[]>([]);
  // El estado del formulario ahora es genérico para crear/editar/clonar
  const [formAttributes, setFormAttributes] = useState<CombinationRuleAttribute[]>([{ type: "", value: "" }]);
  const [attributesCache, setAttributesCache] = useState<Record<string, Attribute[]>>({});
  const [pricingAttributeTypes, setPricingAttributeTypes] = useState<string[]>([]);

  // --- NUEVOS ESTADOS PARA GESTIONAR LA EDICIÓN Y EL TÍTULO ---
  const [editingCombinationId, setEditingCombinationId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("Añadir Nueva Combinación");

  // --- Lógica de Carga de Datos (sin cambios) ---
  const loadValidCombinations = async () => {
    if (materialId) {
      const data = await get<ValidCombination>("/valid-combinations", { params: { materialId } });
      setValidCombinations(data);
    }
  };

  const loadAttributeValues = async (type: string) => {
    if (type && !attributesCache[type]) {
      const values = await get<Attribute>("/attributes", { params: { type } });
      setAttributesCache((prev) => ({ ...prev, [type]: values }));
    }
  };

  useEffect(() => {
    loadValidCombinations();
    const loadPricingAttributeTypes = async () => {
      const allAttrs = await get<Attribute>("/attributes");
      const uniqueTypes = Array.from(new Set(allAttrs.map((attr) => attr.type)));
      setPricingAttributeTypes(uniqueTypes.filter((type) => type.startsWith("MAT_")));
    };
    loadPricingAttributeTypes();
  }, [materialId]);

  // --- Handlers de Formulario Dinámico (ahora renombrados para claridad) ---
  const handleAddAttributeRow = () => {
    setFormAttributes((prev) => [...prev, { type: "", value: "" }]);
  };

  const handleRemoveAttributeRow = (index: number) => {
    setFormAttributes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFormAttributeChange = (index: number, field: "type" | "value", newValue: string) => {
    const updated = [...formAttributes];
    updated[index][field] = newValue;
    if (field === "type") {
      updated[index].value = "";
      loadAttributeValues(newValue);
    }
    setFormAttributes(updated);
  };

  const handleDeleteCombination = async (combinationId: string) => {
    if (window.confirm("¿Seguro que quieres eliminar esta combinación fabricable?")) {
      await remove("/valid-combinations", [combinationId]);
      loadValidCombinations();
    }
  };

  // --- NUEVOS HANDLERS PARA EDITAR Y CLONAR ---
  const handleEdit = (combination: ValidCombination) => {
    setFormTitle("Editando Combinación");
    setEditingCombinationId(combination._id);
    const attributesArray = Object.entries(combination.attributes).map(([type, value]) => {
      // Le decimos al componente que cargue las opciones (los "Valores")
      // para este "Atributo" (type) si aún no están en caché.
      loadAttributeValues(type);

      return { type, value };
    });
    setFormAttributes(attributesArray);
  };

  const handleClone = (combination: ValidCombination) => {
    setFormTitle("Clonando Combinación (Guardar para crear)");
    setEditingCombinationId(null); // Nos aseguramos de que esté en modo CREAR
    const attributesArray = Object.entries(combination.attributes).map(([type, value]) => {
      // Le decimos al componente que cargue las opciones (los "Valores")
      // para este "Atributo" (type) si aún no están en caché.
      loadAttributeValues(type);
      return { type, value };
    });
    setFormAttributes(attributesArray);
  };

  const handleCancelEdit = () => {
    setFormTitle("Añadir Nueva Combinación");
    setEditingCombinationId(null);
    setFormAttributes([{ type: "", value: "" }]);
  };

  // --- FUNCIÓN handleSubmit UNIFICADA ---
  const handleSubmit = async () => {
    const attributesObject = formAttributes.reduce((acc, attr) => {
      if (attr.type && attr.value) {
        acc[attr.type] = attr.value;
      }
      return acc;
    }, {} as Record<string, string>);

    if (!materialId || Object.keys(attributesObject).length === 0) {
      alert("Debes seleccionar atributos para la combinación.");
      return;
    }

    // Lógica para decidir si crear o actualizar
    if (editingCombinationId) {
      await update(`/valid-combinations`, editingCombinationId, { attributes: attributesObject });
    } else {
      await create("/valid-combinations", { materialId, attributes: attributesObject });
    }

    loadValidCombinations();
    handleCancelEdit(); // Reseteamos el formulario a su estado inicial
  };

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: "bold" }}>
        Combinaciones Válidas para este Material
      </Typography>
      <TableContainer component={Paper} sx={{ mb: 3, maxHeight: 300 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>Combinación</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {validCombinations.map((combo) => (
              <TableRow key={combo._id}>
                <TableCell>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {Object.entries(combo.attributes).map(([key, value]) => (
                      <Chip key={key} label={`${key.replace("MAT_", "")}: ${value}`} size="small" />
                    ))}
                  </Box>
                </TableCell>
                <TableCell align="right">
                  {/* --- NUEVOS BOTONES DE ACCIÓN --- */}
                  <IconButton size="small" onClick={() => handleClone(combo)} title="Clonar">
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleEdit(combo)} title="Editar">
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDeleteCombination(combo._id)} title="Eliminar">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: "bold" }}>
        {formTitle}
      </Typography>
      {formAttributes.map((attr, index) => (
        <Box key={index} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel>Atributo</InputLabel>
            <Select value={attr.type} label="Atributo" onChange={(e) => handleFormAttributeChange(index, "type", e.target.value)}>
              {pricingAttributeTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ flex: 1 }} size="small">
            <InputLabel>Valor</InputLabel>
            <Select value={attr.value} label="Valor" disabled={!attr.type} onChange={(e) => handleFormAttributeChange(index, "value", e.target.value)}>
              {(attributesCache[attr.type] || []).map((val) => (
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
      <Button variant="outlined" color="success" onClick={handleAddAttributeRow}>
        + Añadir Atributo
      </Button>

      <Box sx={{ mt: 2 }}>
        <Button onClick={handleSubmit} variant="contained">
          {editingCombinationId ? "Actualizar Combinación" : "Guardar Combinación"}
        </Button>
        {/* Mostramos el botón de cancelar solo si estamos editando o clonando */}
        {(editingCombinationId || formTitle.startsWith("Clonando")) && (
          <Button onClick={handleCancelEdit} sx={{ ml: 1 }}>
            Cancelar
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default CombinacionesValidasTab;
