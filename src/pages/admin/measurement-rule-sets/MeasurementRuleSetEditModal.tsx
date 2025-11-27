// src/components/admin/measurement-rule-sets/MeasurementRuleSetEditModal.tsx
import React, { useState, useEffect } from "react";
import { Box, Modal, Typography, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { create, update } from "../../../services/apiService";

// 1. Importamos la interfaz y el formulario
import type { MeasurementRuleSet, MeasurementRange } from "../../../interfases/measurement-rule-set.interfase";
import MeasurementRuleSetForm from "./MeasurementRuleSetForm";

// --- 2. Props que el Modal recibe de la página (Fase 1) ---
interface MeasurementRuleSetEditModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  ruleSet: Partial<MeasurementRuleSet> | null;
  isEditMode: boolean;
}

// Estilo del Modal
const modalStyle = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "100%", sm: "90vw" },
  maxWidth: 800,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  maxHeight: "90vh",
  overflowY: "auto",
  borderRadius: { xs: 0, sm: 1 },
};

// =============================================================================
// COMPONENTE PRINCIPAL: MeasurementRuleSetEditModal
// =============================================================================

const MeasurementRuleSetEditModal: React.FC<MeasurementRuleSetEditModalProps> = ({ open, onClose, onSave, ruleSet, isEditMode }) => {
  // 3. Estado "inteligente" para el formulario
  const [currentRuleSet, setCurrentRuleSet] = useState<Partial<MeasurementRuleSet>>(
    { name: "", unit: "mm", ranges: [] }, // Estado inicial por defecto
  );

  // 4. Reseteo del estado
  // Se ejecuta CADA VEZ que el modal se abre
  useEffect(() => {
    if (open) {
      setCurrentRuleSet(
        ruleSet || { name: "", unit: "mm", ranges: [] }, // Carga el 'ruleSet' a editar o uno nuevo
      );
    }
  }, [ruleSet, open]);

  // --- 5. Lógica de Guardado (Create/Update) ---
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // los datos del formulario
    const payload = {
      name: currentRuleSet.name,
      unit: currentRuleSet.unit,
      ranges: currentRuleSet.ranges,
    };

    try {
      if (isEditMode) {
        // Enviamos el 'payload' limpio en lugar de 'data'
        await update("/measurement-rule-sets", currentRuleSet._id!, payload);
      } else {
        // El 'create' también debe usar el payload limpio
        await create("/measurement-rule-sets", payload);
      }
      onSave(); // Llama a la función del padre (la página) para recargar la grilla
    } catch (error) {
      console.error("Error al guardar el set de reglas:", error);
      alert("Error al guardar. Revisa la consola.");
    }
  };

  // --- 6. Handlers (se pasarán al formulario "tonto") ---

  // Handler para campos de texto simples (name, unit)
  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setCurrentRuleSet((prev) => ({ ...prev, [name]: value }));
  };

  // --- Handlers para el array dinámico 'ranges' ---

  const handleAddRange = () => {
    const newRange: MeasurementRange = {
      label: "",
      min: 0,
      max: 0,
      priceType: "ml", // 'ml' por defecto
    };
    setCurrentRuleSet((prev) => ({
      ...prev,
      ranges: [...(prev.ranges || []), newRange],
    }));
  };

  const handleRemoveRange = (index: number) => {
    setCurrentRuleSet((prev) => ({
      ...prev,
      ranges: (prev.ranges || []).filter((_, i) => i !== index),
    }));
  };

  const handleRangeChange = (index: number, field: keyof MeasurementRange, value: string | number) => {
    setCurrentRuleSet((prev) => {
      const newRanges = [...(prev.ranges || [])];
      // Actualiza el campo específico del rango específico
      (newRanges[index] as any)[field] = value;
      return { ...prev, ranges: newRanges };
    });
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle}>
        <IconButton onClick={onClose} sx={{ position: "absolute", right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
        <Typography variant="h6">{isEditMode ? "Editar" : "Añadir"} Set de Reglas de Medición</Typography>

        {/* --- 7. Renderizado del Formulario --- */}
        <Box sx={{ mt: 3 }}>
          <MeasurementRuleSetForm
            // Pasamos el estado
            currentRuleSet={currentRuleSet}
            isEditMode={isEditMode}
            // Pasamos los handlers
            handleSubmit={handleSubmit}
            handleTextChange={handleTextChange}
            handleRangeChange={handleRangeChange}
            handleAddRange={handleAddRange}
            handleRemoveRange={handleRemoveRange}
          />
        </Box>
      </Box>
    </Modal>
  );
};

export default MeasurementRuleSetEditModal;
