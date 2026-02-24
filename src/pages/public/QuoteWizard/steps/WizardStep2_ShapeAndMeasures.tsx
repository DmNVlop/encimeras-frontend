import React from "react";
import { Alert } from "@mui/material";

// --- HOOKS Y COMPONENTES ---
import { useWizardStep2 } from "./components/step2/useWizardStep2";
import { ShapeSelectionView } from "./components/step2/ShapeSelectionView";
import { MeasuresEditorView } from "./components/step2/MeasuresEditorView";
import { MaterialAttributeModal } from "@/pages/public/common/MaterialAttributeModal";

export const WizardStep2_ShapeAndMeasures: React.FC = () => {
  const {
    wizardTempMaterial,
    mainPieces,
    currentShapeVariation,
    materialsList,
    loadingMaterials,
    isChangeMaterialModalOpen,
    materialToChange,
    initialSelectionForChange,
    handleSelectVariation,
    handleMeasureChange,
    handleOpenChangeMaterialModal,
    handleConfirmMaterialChange,
    handleResetShape,
    handleCloseModal,
  } = useWizardStep2();

  // 1. Validar que el Step 1 esté completo
  if (!wizardTempMaterial) {
    return <Alert severity="warning">Por favor, vuelve al Paso 1 y selecciona un material base primero.</Alert>;
  }

  // 2. Renderizado Condicional: VISTA A (Selección) o VISTA B (Medidas)
  return (
    <>
      {mainPieces.length === 0 ? (
        <ShapeSelectionView onSelectVariation={handleSelectVariation} />
      ) : (
        <MeasuresEditorView
          mainPieces={mainPieces}
          materialsList={materialsList}
          loadingMaterials={loadingMaterials}
          currentShapeVariation={currentShapeVariation}
          handleResetShape={handleResetShape}
          handleOpenChangeMaterialModal={handleOpenChangeMaterialModal}
          handleMeasureChange={handleMeasureChange}
        />
      )}

      {/* --- Modal para "Cambiar Material" --- */}
      <MaterialAttributeModal
        open={isChangeMaterialModalOpen}
        onClose={handleCloseModal}
        material={materialToChange}
        initialSelection={initialSelectionForChange}
        onConfirm={handleConfirmMaterialChange}
      />
    </>
  );
};
