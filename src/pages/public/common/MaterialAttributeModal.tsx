// src/components/public/MaterialAttributeModal.tsx
import React, { useState, useEffect } from "react";
import { Box, Typography, CircularProgress, Modal, Button, ToggleButtonGroup, ToggleButton } from "@mui/material";

// Importaciones necesarias (asegúrate de que las rutas sean correctas)
import { get } from "@/services/api.service";
import type { Material } from "@/interfases/materials.interfase";
import { modalStyle } from "@/pages/public/QuoteWizard/steps/_Modal_Material_Style"; // Reutilizamos el estilo

// Interfaces locales que necesita este componente
type SelectionState = Record<string, string>;
type OptionsState = Record<string, string[]>;

// --- Props que el Modal recibirá ---
interface MaterialAttributeModalProps {
  open: boolean;
  onClose: () => void;
  material: Material | null;
  // Para Step 2: pre-rellenar con la selección existente
  initialSelection?: SelectionState;
  // Función a llamar al confirmar
  onConfirm: (payload: { materialId: string; materialName: string; materialImage?: string; selectedAttributes: SelectionState }) => void;
}

export const MaterialAttributeModal: React.FC<MaterialAttributeModalProps> = ({ open, onClose, material, initialSelection, onConfirm }) => {
  // --- Estados internos (copiados de WizardStep1) ---
  const [modalSelection, setModalSelection] = useState<SelectionState>(initialSelection || {});
  const [modalOptions, setModalOptions] = useState<OptionsState>({});
  const [modalLoading, setModalLoading] = useState(false);

  // --- Lógica de Carga de Opciones (copiada de WizardStep1) ---
  const fetchAvailableOptions = async (mat: Material, currentSelection: SelectionState) => {
    setModalLoading(true);
    try {
      const selectionFilters = Object.entries(currentSelection).reduce(
        (acc, [key, value]) => {
          if (value) acc[key] = value;
          return acc;
        },
        {} as Record<string, string>,
      );

      const availableOpts = await get<OptionsState>("/valid-combinations/available-options", {
        params: { materialId: mat._id, ...selectionFilters },
      });
      setModalOptions(availableOpts as unknown as OptionsState);
    } catch (error) {
      console.error("Error fetching available options:", error);
    } finally {
      setModalLoading(false);
    }
  };

  // Efecto para cargar opciones cuando cambia la selección o el material
  useEffect(() => {
    if (material && open) {
      // Solo cargar si el modal está abierto y hay material
      // Resetear opciones si el material cambia
      if (modalSelection && Object.keys(modalSelection).length > 0) {
        fetchAvailableOptions(material, modalSelection);
      } else {
        // Carga inicial al abrir o si se resetea
        const initialSel = initialSelection || material.selectableAttributes.reduce((acc, attr) => ({ ...acc, [attr]: "" }), {});
        setModalSelection(initialSel);
        fetchAvailableOptions(material, initialSel);
      }
    } else {
      // Limpiar opciones cuando se cierra o no hay material
      setModalOptions({});
      setModalSelection(initialSelection || {}); // Reset a initial o vacío
    }
  }, [material, open, initialSelection]); // Depende de initialSelection por si cambia en Step 2

  // Reacciona a los cambios internos de la selección para recargar opciones
  useEffect(() => {
    if (material && open) {
      const hasMadeSelection = Object.values(modalSelection).some((v) => v !== "");
      if (hasMadeSelection) {
        fetchAvailableOptions(material, modalSelection);
      }
    }
  }, [modalSelection]); // Dependencia clave

  // --- Handlers (copiados de WizardStep1) ---
  const handleAttributeSelectionChange = (attributeKey: string, value: string | null) => {
    if (value === null || !material) return;

    const attributeOrder = material.selectableAttributes || [];
    const changedIndex = attributeOrder.indexOf(attributeKey);
    const newSelection = { ...modalSelection, [attributeKey]: value };

    for (let i = changedIndex + 1; i < attributeOrder.length; i++) {
      newSelection[attributeOrder[i]] = "";
    }
    setModalSelection(newSelection);
  };

  // Handler de Confirmación (modificado para llamar a la prop)
  const handleConfirm = () => {
    if (!material) return;

    // Llama a la función onConfirm pasada por props
    onConfirm({
      materialId: material._id,
      materialName: material.name,
      materialImage: (material as any).imageUrl || undefined,
      selectedAttributes: modalSelection,
    });
    // onClose(); // El componente padre decidirá si cerrar
  };

  // Habilitar botón de confirmar
  const isSelectionComplete = material ? material.selectableAttributes.every((attr) => modalSelection[attr]) : false;

  // --- JSX del Modal (copiado de WizardStep1) ---
  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle}>
        <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
          Configura tu "{material?.name}"
        </Typography>

        {modalLoading && <CircularProgress size={20} sx={{ mb: 1 }} />}

        {/* --- JSX de los ToggleButtonGroup (idéntico a WizardStep1) --- */}
        {material?.selectableAttributes.map((attrKey, index) => {
          const isDisabled =
            modalLoading ||
            (index > 0 && !modalSelection[material.selectableAttributes[index - 1]]) ||
            !modalOptions[attrKey] ||
            modalOptions[attrKey].length === 0;

          return (
            <Box key={attrKey} sx={{ mb: 2.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: "bold", textTransform: "uppercase", color: isDisabled ? "text.disabled" : "text.primary" }}>
                {attrKey.replace("MAT_", "")}
              </Typography>
              <ToggleButtonGroup
                value={modalSelection[attrKey] || null}
                exclusive
                onChange={(_event, newValue) => handleAttributeSelectionChange(attrKey, newValue)}
                disabled={isDisabled}
                sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 0.5 }}
              >
                {(modalOptions[attrKey] || []).map((optionValue) => (
                  <ToggleButton
                    key={optionValue}
                    value={optionValue}
                    style={{ borderLeft: "1px solid rgba(0, 0, 0, 0.23)" }}
                    size="small"
                    sx={{
                      flexGrow: 1,
                      border: "1px solid rgba(0, 0, 0, 0.23)",
                      "&.Mui-selected": {
                        backgroundColor: "primary.main",
                        color: "white",
                        "&:hover": { backgroundColor: "primary.dark" },
                      },
                    }}
                  >
                    {optionValue}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>
          );
        })}

        <Button onClick={handleConfirm} variant="contained" fullWidth sx={{ mt: 2 }} disabled={!isSelectionComplete || modalLoading}>
          Confirmar Material
        </Button>
      </Box>
    </Modal>
  );
};
