// src/components/admin/materials/MaterialEditModal.tsx
import React, { useState, useEffect } from "react";
import { Box, Modal, Typography, Tabs, Tab, IconButton, type SelectChangeEvent } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DatosGeneralesForm from "./DatosGeneralesForm";
import CombinacionesValidasTab from "./CombinacionesValidasTab";
import { get, create, update } from "../../../services/apiService";
import type { Material } from "../../../interfases/materials.interfase";
import type { Attribute } from "../../../interfases/attribute.interfase";

// --- Interfaz para el "paquete" de atributos ---
export interface AttributesBundle {
  categories: Attribute[];
  matTypes: Attribute[];

  pricingAttributeTypes: string[];
}

// --- Props que el Modal necesita del padre (MaterialsPage) ---
interface MaterialEditModalProps {
  open: boolean;
  onClose: () => void;
  material: Partial<Material> | null;
  isEditMode: boolean;
  onSave: () => void;
}

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

// --- Componente auxiliar para las Pestañas ---
function TabPanel(props: { children?: React.ReactNode; index: number; value: number }) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

// =============================================================================
// COMPONENTE PRINCIPAL: MaterialEditModal
// =============================================================================

const MaterialEditModal: React.FC<MaterialEditModalProps> = ({ open, onClose, material, isEditMode, onSave }) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [currentMaterial, setCurrentMaterial] = useState<Partial<Material>>(material || {});

  // Estado que contendrá todas las listas de opciones para los formularios
  const [attributes, setAttributes] = useState<AttributesBundle>({
    categories: [],
    matTypes: [],
    pricingAttributeTypes: [],
  });

  // Efecto para resetear el estado del modal cada vez que se abre
  // useEffect(() => {
  //   setCurrentMaterial(material || { isActive: true, faces: [], groups: [], thicknesses: [], finishes: [], textures: [], category: "", type: "", pricingAttributes: [] });
  //   setTabIndex(0);
  // }, [material, open]);

  useEffect(() => {
    // Los únicos arrays que debe tener el material son sus pricingAttributes
    setCurrentMaterial(material || { isActive: true, category: "", type: "", pricingRecipes: [], selectableAttributes: [] });
    setTabIndex(0);
  }, [material, open]);

  // Efecto para cargar todas las listas de atributos una sola vez
  useEffect(() => {
    const loadAttributes = async () => {
      const [categoryData, typeData, allAttrs] = await Promise.all([
        get<Attribute>("/attributes", { params: { type: "MAT_CATEGORY" } }),
        get<Attribute>("/attributes", { params: { type: "MAT_TYPE" } }),
        get<Attribute>("/attributes"),
      ]);
      const uniqueTypes = Array.from(new Set(allAttrs.map((attr) => attr.type)));

      // Ahora esta asignación es segura porque los tipos coinciden
      setAttributes({
        categories: categoryData,
        matTypes: typeData,
        pricingAttributeTypes: uniqueTypes.filter((type) => type.startsWith("MAT_")),
      });
    };
    loadAttributes();
  }, []);

  // --- Lógica de guardado que se pasará al formulario ---
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = { ...currentMaterial };

    if (isEditMode) {
      await update("/materials", currentMaterial._id!, data);
    } else {
      await create("/materials", data);
    }
    onSave(); // Avisa al padre (MaterialsPage) para que recargue los datos
  };

  // --- Manejadores de eventos que se pasarán al formulario ---
  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    console.log("🚀 ~ handleTextChange ~ event:", event);
    const { name, value } = event.target;
    setCurrentMaterial((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (event: SelectChangeEvent<string | string[]>) => {
    const { name, value } = event.target;
    setCurrentMaterial((prev) => ({ ...prev, [name]: value }));
  };

  const handleDeleteChip = (field: keyof Material, valueToDelete: string) => {
    setCurrentMaterial((prev) => {
      const currentValues = (prev[field] as string[]) || [];
      return {
        ...prev,
        [field]: currentValues.filter((value) => value !== valueToDelete),
      };
    });
  };

  const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    setCurrentMaterial((prev) => ({ ...prev, [name]: checked }));
  };

  // -- HANDLES PARA EL MATERIAL --
  const handleAddRecipe = () => {
    setCurrentMaterial((prev) => ({
      ...prev,
      pricingRecipes: [
        ...(prev.pricingRecipes || []),
        // Añade una nueva receta vacía
        { productType: "", pricingAttributes: [], unit: "m2" },
      ],
    }));
  };

  const handleRemoveRecipe = (index: number) => {
    setCurrentMaterial((prev) => ({
      ...prev,
      pricingRecipes: (prev.pricingRecipes || []).filter((_, i) => i !== index),
    }));
  };

  const handleRecipeChange = (index: number, field: string, value: string | string[]) => {
    setCurrentMaterial((prev) => {
      const newRecipes = [...(prev.pricingRecipes || [])];
      // Actualiza el campo específico de la receta específica
      (newRecipes[index] as any)[field] = value;
      return { ...prev, pricingRecipes: newRecipes };
    });
  };
  // -- FIN - HANDLES PARA EL MATERIAL --

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle}>
        <IconButton onClick={onClose} sx={{ position: "absolute", right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
        <Typography variant="h6">{isEditMode ? "Editar" : "Añadir"} Material</Typography>
        <Box sx={{ borderBottom: 1, borderColor: "divider", mt: 2 }}>
          <Tabs value={tabIndex} onChange={(_e, newValue) => setTabIndex(newValue)}>
            <Tab label="Datos Generales" />
            <Tab label="Combinaciones Fabricables" disabled={!isEditMode} />
          </Tabs>
        </Box>
        <TabPanel value={tabIndex} index={0}>
          <DatosGeneralesForm
            currentMaterial={currentMaterial}
            attributes={attributes}
            handleSubmit={handleSubmit}
            handleTextChange={handleTextChange}
            handleSelectChange={handleSelectChange}
            handleDeleteChip={handleDeleteChip}
            handleSwitchChange={handleSwitchChange}
            handleAddRecipe={handleAddRecipe}
            handleRemoveRecipe={handleRemoveRecipe}
            handleRecipeChange={handleRecipeChange}
          />
        </TabPanel>
        <TabPanel value={tabIndex} index={1}>
          <CombinacionesValidasTab materialId={currentMaterial?._id} />
        </TabPanel>
      </Box>
    </Modal>
  );
};

export default MaterialEditModal;
