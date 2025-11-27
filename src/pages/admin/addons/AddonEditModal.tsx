// src/components/admin/addons/AddonEditModal.tsx
import React, { useState, useEffect } from "react";
import { Box, Modal, Typography, IconButton, type SelectChangeEvent } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { get, create, update } from "../../../services/apiService";
import type { Addon } from "../../../interfases/addon.interfase";
import type { MeasurementRuleSet } from "../../../interfases/measurement-rule-set.interfase";
import type { Attribute } from "../../../interfases/attribute.interfase";
import type { Material } from "../../../interfases/materials.interfase"; // Necesitamos importar Material

import AddonForm from "./AddonForm";

interface AddonEditModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  addon: Partial<Addon> | null;
  isEditMode: boolean;
}

const modalStyle = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "100%", sm: "90vw" },
  maxWidth: 900, // Un poco más ancho para los nuevos campos
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  maxHeight: "90vh",
  overflowY: "auto",
  borderRadius: 2,
};

interface DropdownData {
  ruleSets: MeasurementRuleSet[];
  attributeTypes: string[];
  materialCategories: string[]; // <--- NUEVO: Lista de categorías disponibles (HPL, etc.)
}

const AddonEditModal: React.FC<AddonEditModalProps> = ({ open, onClose, onSave, addon, isEditMode }) => {
  // Estado Inicial Actualizado con los nuevos defaults
  const [currentAddon, setCurrentAddon] = useState<Partial<Addon>>(
    addon || {
      pricingType: "FIXED",
      category: "OTRO",
      allowedMaterialCategories: [],
      requiredMeasurements: ["quantity"],
    },
  );

  const [dropdownData, setDropdownData] = useState<DropdownData>({
    ruleSets: [],
    attributeTypes: [],
    materialCategories: [],
  });

  // --- CARGA DE DATOS ---
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        // Cargar RuleSets, Atributos y MATERIALES (para sacar sus categorías)
        const [ruleSetData, allAttrs, materialsData] = await Promise.all([
          get<MeasurementRuleSet>("/measurement-rule-sets"),
          get<Attribute>("/attributes"),
          get<Material>("/materials"),
        ]);

        const uniqueAttrTypes = Array.from(new Set(allAttrs.map((attr) => attr.type))).filter((t) => t.startsWith("MAT_"));

        // Extraer categorías únicas de los materiales (ej: ['HPL', 'COMPACTO'])
        const uniqueMatCategories = Array.from(new Set(materialsData.map((m) => m.category)));

        setDropdownData({
          ruleSets: ruleSetData,
          attributeTypes: uniqueAttrTypes,
          materialCategories: uniqueMatCategories, // <--- Guardamos
        });
      } catch (error) {
        console.error("Error al cargar datos:", error);
      }
    };
    loadDropdownData();
  }, []);

  useEffect(() => {
    if (open) {
      setCurrentAddon(
        addon || {
          pricingType: "FIXED",
          category: "OTRO",
          allowedMaterialCategories: [], // Default vacío
          requiredMeasurements: ["quantity"], // Default cantidad
        },
      );
    }
  }, [addon, open]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Payload base con los nuevos campos
    const payload: any = {
      code: currentAddon.code,
      name: currentAddon.name,

      // Nuevos Campos UI
      category: currentAddon.category,
      allowedMaterialCategories: currentAddon.allowedMaterialCategories,
      requiredMeasurements: currentAddon.requiredMeasurements,

      description: currentAddon.description || "",
      imageUrl: currentAddon.imageUrl || "",

      // Lógica Precios
      pricingType: currentAddon.pricingType,
      productTypeMap: currentAddon.productTypeMap,

      // Opcionales
      inheritedAttributes: currentAddon.inheritedAttributes,
      measurementRuleSetId: currentAddon.measurementRuleSetId,
    };

    // Limpieza condicional
    if (payload.pricingType !== "RANGE_BASED") {
      delete payload.measurementRuleSetId;
      delete payload.inheritedAttributes;
    }

    try {
      if (isEditMode) {
        await update("/addons", currentAddon._id!, payload);
      } else {
        await create("/addons", payload);
      }
      onSave();
    } catch (error) {
      console.error("Error save:", error);
      alert("Error al guardar. Verifica que todos los campos requeridos estén llenos.");
    }
  };

  // --- HANDLERS ---
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCurrentAddon((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string | string[]>) => {
    const { name, value } = e.target;
    // Si es array (multiple select), value ya viene como array
    setCurrentAddon((prev) => ({ ...prev, [name]: value }));
  };

  // Handler genérico para borrar chips de arrays (sirve para materials, attributes, measurements)
  const handleDeleteChip = (field: keyof Addon, valueToDelete: string) => {
    setCurrentAddon((prev: any) => {
      const currentValues = (prev[field] as string[]) || [];
      return {
        ...prev,
        [field]: currentValues.filter((val) => val !== valueToDelete),
      };
    });
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle}>
        <IconButton onClick={onClose} sx={{ position: "absolute", right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
        <Typography variant="h5" sx={{ mb: 3 }}>
          {isEditMode ? "Editar" : "Añadir"} Complemento
        </Typography>

        <AddonForm
          currentAddon={currentAddon}
          isEditMode={isEditMode}
          ruleSets={dropdownData.ruleSets}
          attributeTypes={dropdownData.attributeTypes}
          materialCategories={dropdownData.materialCategories} // <--- Pasamos las categorías
          handleSubmit={handleSubmit}
          handleTextChange={handleTextChange}
          handleSelectChange={handleSelectChange}
          handleDeleteChip={handleDeleteChip}
        />
      </Box>
    </Modal>
  );
};

export default AddonEditModal;
