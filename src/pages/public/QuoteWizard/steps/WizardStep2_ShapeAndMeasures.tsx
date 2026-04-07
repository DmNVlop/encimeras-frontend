import React from "react";
import { Alert } from "@mui/material";

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
    isAddPieceModalOpen,
    handleSelectVariation,
    handleMeasureChange,
    handleOpenChangeMaterialModal,
    handleConfirmMaterialChange,
    handleResetShape,
    handleCloseModal,
    handleOpenAddPieceModal,
    handleCloseAddPieceModal,
    handleAddPiece,
    handleRemovePiece,
    handleReorderPiece,
    handleConnectionTypeChange,
  } = useWizardStep2();

  if (!wizardTempMaterial) {
    return <Alert severity="warning">Por favor, vuelve al Paso 1 y selecciona un material base primero.</Alert>;
  }

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
          handleOpenAddPieceModal={handleOpenAddPieceModal}
          handleRemovePiece={handleRemovePiece}
          handleReorderPiece={handleReorderPiece}
          handleConnectionTypeChange={handleConnectionTypeChange}
        />
      )}

      <MaterialAttributeModal
        open={isChangeMaterialModalOpen}
        onClose={handleCloseModal}
        material={materialToChange}
        initialSelection={initialSelectionForChange}
        onConfirm={handleConfirmMaterialChange}
      />

      <MaterialAttributeModal
        open={isAddPieceModalOpen}
        onClose={handleCloseAddPieceModal}
        material={null}
        onConfirm={(payload) => {
          handleAddPiece({
            materialId: payload.materialId,
            selectedAttributes: payload.selectedAttributes,
            measurements: payload.measurements || { length_mm: 1200, width_mm: 600 },
            connectionType: payload.connectionType || "LINEAR",
          });
        }}
        showMaterialSelector={true}
        materialsList={materialsList}
        defaultMaterialId={wizardTempMaterial.materialId}
        initialSelection={wizardTempMaterial.selectedAttributes}
        showMeasurements={true}
        showConnectionType={true}
        modalTitle="Agregar Nueva Pieza"
        confirmButtonText="Agregar Pieza"
      />
    </>
  );
};
