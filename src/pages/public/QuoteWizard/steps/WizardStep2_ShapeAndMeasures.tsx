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
    isAddPieceModalOpen,
    editingPieceIndex,
    handleSelectVariation,
    handleMeasureChange,
    handleOpenChangeMaterialModal,
    handleConfirmMaterialChange,
    handleResetShape,
    handleCancelShapeSelection,
    handleCloseModal,
    handleOpenAddPieceModal,
    handleCloseAddPieceModal,
    handleAddPiece,
    handleRemovePiece,
    handleReorderPiece,
    handleConnectionTypeChange,
    isShapeSelectionPending,
  } = useWizardStep2();

  if (!wizardTempMaterial) {
    return <Alert severity="warning">Por favor, vuelve al Paso 1 y selecciona un material base primero.</Alert>;
  }

  const isModalOpen = isChangeMaterialModalOpen || isAddPieceModalOpen;
  const currentPiece = isChangeMaterialModalOpen && editingPieceIndex !== null ? mainPieces[editingPieceIndex] : null;
  const currentMaterial = currentPiece ? materialsList.find((m) => m._id === currentPiece.materialId) : null;

  return (
    <>
      {mainPieces.length === 0 || isShapeSelectionPending ? (
        <ShapeSelectionView onSelectVariation={handleSelectVariation} onCancel={handleCancelShapeSelection} />
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
        open={isModalOpen}
        onClose={isChangeMaterialModalOpen ? handleCloseModal : handleCloseAddPieceModal}
        material={currentMaterial || null}
        initialSelection={currentPiece?.selectedAttributes}
        onConfirm={(payload) => {
          if (isChangeMaterialModalOpen && editingPieceIndex !== null) {
            handleConfirmMaterialChange({
              ...payload,
              pieceIndex: editingPieceIndex,
            });
          } else {
            handleAddPiece({
              materialId: payload.materialId,
              selectedAttributes: payload.selectedAttributes,
              measurements: payload.measurements || { length_mm: 1200, width_mm: 600 },
              connectionType: payload.connectionType || "LINEAR",
            });
          }
        }}
        showMaterialSelector={true}
        materialsList={materialsList}
        defaultMaterialId={wizardTempMaterial?.materialId}
        showMeasurements={!isChangeMaterialModalOpen}
        showConnectionType={true}
        modalTitle={isChangeMaterialModalOpen ? "Cambiar Material de Pieza" : "Agregar Nueva Pieza"}
        confirmButtonText={isChangeMaterialModalOpen ? "Guardar" : "Agregar Pieza"}
      />
    </>
  );
};
