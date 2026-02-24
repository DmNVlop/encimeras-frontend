import React from "react";
import { Box, CircularProgress, Alert } from "@mui/material";

// --- HOOKS Y COMPONENTES ---
import { useWizardStep1 } from "./components/step1/useWizardStep1";
import { Step1Header } from "./components/step1/Step1Header";
import { MaterialFilters } from "./components/step1/MaterialFilters";
import { MaterialsGrid } from "./components/step1/MaterialsGrid";
import { MaterialAttributeModal } from "@/pages/public/common/MaterialAttributeModal";

export const WizardStep1_Materials: React.FC = () => {
  const {
    materials,
    loadingMaterials,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    uniqueCategories,
    filteredMaterials,
    isModalOpen,
    materialForModal,
    wizardTempMaterial,
    handleOpenModal,
    handleCloseModal,
    handleConfirmationFromModal,
  } = useWizardStep1();

  if (loadingMaterials) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "top",
          gap: 2,
          mb: 3,
        }}
      >
        {/* --- TÍTULO DEL PASO --- */}
        <Step1Header />

        {/* --- FILTRO / BUSCADOR --- */}
        {materials.length > 0 && (
          <MaterialFilters
            categories={uniqueCategories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        )}
      </Box>

      {/* --- Feedback para el usuario --- */}
      {wizardTempMaterial && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Material seleccionado: <strong>{wizardTempMaterial.materialName}</strong>. Ya puedes pulsar "Siguiente".
        </Alert>
      )}

      {/* --- GRID DE MATERIALES --- */}
      <MaterialsGrid
        materials={filteredMaterials}
        selectedMaterialId={wizardTempMaterial?.materialId}
        searchTerm={searchTerm}
        onMaterialSelect={handleOpenModal}
      />

      {/* --- Modal de Selección de Atributos --- */}
      <MaterialAttributeModal open={isModalOpen} onClose={handleCloseModal} material={materialForModal} onConfirm={handleConfirmationFromModal} />
    </Box>
  );
};
