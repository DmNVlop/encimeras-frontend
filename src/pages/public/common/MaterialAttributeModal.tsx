// src/components/public/MaterialAttributeModal.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Modal,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
} from "@mui/material";

import { get } from "@/services/api.service";
import type { Material } from "@/interfases/materials.interfase";
import { modalStyle } from "@/pages/public/QuoteWizard/steps/_Modal_Material_Style";
import { ConnectionTypeIcon, connectionTypeLabels, type ConnectionType } from "@/pages/public/common/Icons/ConnectionTypeIcons";

type SelectionState = Record<string, string>;
type OptionsState = Record<string, string[]>;

interface MaterialAttributeModalProps {
  open: boolean;
  onClose: () => void;
  material: Material | null;
  initialSelection?: SelectionState;
  onConfirm: (payload: {
    materialId: string;
    materialName: string;
    materialImage?: string;
    selectedAttributes: SelectionState;
    measurements?: { length_mm: number; width_mm: number };
    connectionType?: ConnectionType;
  }) => void;
  showMeasurements?: boolean;
  showConnectionType?: boolean;
  defaultMeasurements?: { length_mm: number; width_mm: number };
  defaultConnectionType?: ConnectionType;
  modalTitle?: string;
  confirmButtonText?: string;
  showMaterialSelector?: boolean;
  materialsList?: Material[];
  defaultMaterialId?: string;
}

export const MaterialAttributeModal: React.FC<MaterialAttributeModalProps> = ({
  open,
  onClose,
  material: initialMaterial,
  initialSelection,
  onConfirm,
  showMeasurements = false,
  showConnectionType = false,
  defaultMeasurements = { length_mm: 1200, width_mm: 600 },
  defaultConnectionType = "LINEAR",
  modalTitle,
  confirmButtonText = "Confirmar Material",
  showMaterialSelector = false,
  materialsList = [],
  defaultMaterialId,
}) => {
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(initialMaterial);
  const [modalSelection, setModalSelection] = useState<SelectionState>({});
  const [modalOptions, setModalOptions] = useState<OptionsState>({});
  const [modalLoading, setModalLoading] = useState(false);
  const [lengthMm, setLengthMm] = useState(defaultMeasurements.length_mm);
  const [widthMm, setWidthMm] = useState(defaultMeasurements.width_mm);
  const [connectionType, setConnectionType] = useState<ConnectionType>(defaultConnectionType);
  const [isFirstOpen, setIsFirstOpen] = useState(true);

  const material = showMaterialSelector ? selectedMaterial : initialMaterial;

  const fetchAvailableOptions = useCallback(async (mat: Material, currentSelection: SelectionState) => {
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
  }, []);

  // Inicializar selection cuando cambia el material o se abre el modal
  useEffect(() => {
    if (material && open) {
      const initialSel = initialSelection || material.selectableAttributes.reduce((acc, attr) => ({ ...acc, [attr]: "" }), {});
      setModalSelection(initialSel);
      setModalOptions({});
      fetchAvailableOptions(material, initialSel);
    } else if (!open) {
      setModalSelection({});
      setModalOptions({});
    }
  }, [material, open, initialSelection, fetchAvailableOptions]);

  // Resettear medidas y connectionType solo en la primera apertura del modal
  useEffect(() => {
    if (open && isFirstOpen) {
      setLengthMm(defaultMeasurements.length_mm);
      setWidthMm(defaultMeasurements.width_mm);
      setConnectionType(defaultConnectionType);

      if (showMaterialSelector && materialsList.length > 0) {
        const defaultMat = materialsList.find((m) => m._id === defaultMaterialId) || materialsList[0];
        setSelectedMaterial(defaultMat);
      }

      setIsFirstOpen(false);
    }

    if (!open) {
      setIsFirstOpen(true);
    }
  }, [open, isFirstOpen, defaultMeasurements, defaultConnectionType, showMaterialSelector, materialsList, defaultMaterialId]);

  // Cuando cambia la selección de atributos, recargar opciones
  useEffect(() => {
    if (material && open && Object.keys(modalOptions).length > 0) {
      const hasSelection = Object.values(modalSelection).some((v) => v !== "");
      if (hasSelection) {
        fetchAvailableOptions(material, modalSelection);
      }
    }
  }, [modalSelection]);

  const handleAttributeSelectionChange = useCallback(
    (attributeKey: string, value: string | null) => {
      if (value === null || !material) return;

      const attributeOrder = material.selectableAttributes || [];
      const changedIndex = attributeOrder.indexOf(attributeKey);
      const newSelection = { ...modalSelection, [attributeKey]: value };

      for (let i = changedIndex + 1; i < attributeOrder.length; i++) {
        newSelection[attributeOrder[i]] = "";
      }
      setModalSelection(newSelection);
    },
    [material, modalSelection],
  );

  const handleMaterialChange = useCallback((_event: React.SyntheticEvent, newValue: Material | null) => {
    if (newValue) {
      setSelectedMaterial(newValue);
      const defaultAttrs = newValue.selectableAttributes.reduce((acc, attr) => ({ ...acc, [attr]: "" }), {});
      setModalSelection(defaultAttrs);
      setModalOptions({});
    }
  }, []);

  const handleConfirm = useCallback(() => {
    if (!material) return;

    onConfirm({
      materialId: material._id,
      materialName: material.name,
      materialImage: (material as any).imageUrl || undefined,
      selectedAttributes: modalSelection,
      ...(showMeasurements && { measurements: { length_mm: lengthMm || 1200, width_mm: widthMm || 600 } }),
      ...(showConnectionType && { connectionType }),
    });
  }, [material, modalSelection, showMeasurements, lengthMm, widthMm, showConnectionType, connectionType, onConfirm]);

  const isSelectionComplete = material ? material.selectableAttributes.every((attr) => modalSelection[attr]) : false;

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle}>
        <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
          {modalTitle || `Configura tu "${material?.name}"`}
        </Typography>

        {showMaterialSelector && (
          <Autocomplete
            options={materialsList}
            getOptionLabel={(option) => option.name}
            value={selectedMaterial}
            onChange={handleMaterialChange}
            renderInput={(params) => <TextField {...params} label="Material" placeholder="Selecciona un material" />}
            sx={{ mb: 2 }}
          />
        )}

        {modalLoading && <CircularProgress size={20} sx={{ mb: 1 }} />}

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

        {showMeasurements && (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Largo (mm)" type="number" value={lengthMm} onChange={(e) => setLengthMm(parseInt(e.target.value) || 0)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Ancho (mm)" type="number" value={widthMm} onChange={(e) => setWidthMm(parseInt(e.target.value) || 0)} />
            </Grid>
          </Grid>
        )}

        {showConnectionType && (
          <FormControl fullWidth sx={{ mt: showMeasurements ? 2 : 0 }}>
            <InputLabel>Conexión con pieza anterior</InputLabel>
            <Select value={connectionType} label="Conexión con pieza anterior" onChange={(e) => setConnectionType(e.target.value as ConnectionType)}>
              <MenuItem value="LINEAR">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <ConnectionTypeIcon type="LINEAR" sx={{ fontSize: 24 }} />
                  <span>{connectionTypeLabels.LINEAR}</span>
                </Box>
              </MenuItem>
              <MenuItem value="CORNER_LEFT">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <ConnectionTypeIcon type="CORNER_LEFT" sx={{ fontSize: 24 }} />
                  <span>{connectionTypeLabels.CORNER_LEFT}</span>
                </Box>
              </MenuItem>
              <MenuItem value="CORNER_RIGHT">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <ConnectionTypeIcon type="CORNER_RIGHT" sx={{ fontSize: 24 }} />
                  <span>{connectionTypeLabels.CORNER_RIGHT}</span>
                </Box>
              </MenuItem>
              <MenuItem value="NONE">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <ConnectionTypeIcon type="NONE" sx={{ fontSize: 24 }} />
                  <span>{connectionTypeLabels.NONE}</span>
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
        )}

        <Button onClick={handleConfirm} variant="contained" fullWidth sx={{ mt: 3 }} disabled={!isSelectionComplete || modalLoading}>
          {confirmButtonText}
        </Button>
      </Box>
    </Modal>
  );
};
