import React from "react";
import { Box, CircularProgress, Alert } from "@mui/material";

// --- HOOKS Y COMPONENTES ---
import { useWizardStep3, DEFAULT_IMAGE } from "./components/step3/useWizardStep3";
import { Step3Header } from "./components/step3/Step3Header";
import { UnionsSection } from "./components/step3/UnionsSection";
import { JobsSection } from "./components/step3/JobsSection";

export const WizardStep3_JobsAndAssembly: React.FC = () => {
  const {
    mainPieces,
    activeTabIndex,
    isLoading,
    assemblyAddons,
    jobAddons,
    materialMapFull,
    materialCategoryMap,
    getAddonImageUrl,
    handleImageError,
    getCurrentAssemblyForUnion,
    handleAssemblyChange,
    handlePieceSelect,
    handleAddJob,
    handleRemoveJob,
    handleUpdateJobMeasurement,
  } = useWizardStep3();

  if (isLoading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );

  if (mainPieces.length === 0) return <Alert severity="warning">Sin piezas definidas.</Alert>;

  const numberOfUnions = Math.max(0, mainPieces.length - 1);
  const activePiece = mainPieces[activeTabIndex];

  return (
    <Box sx={{ pb: 8 }}>
      {/* Título Principal */}
      <Step3Header />

      {/* BLOQUE A: UNIONES */}
      <UnionsSection
        numberOfUnions={numberOfUnions}
        mainPieces={mainPieces}
        assemblyAddons={assemblyAddons}
        materialCategoryMap={materialCategoryMap}
        getCurrentAssemblyForUnion={getCurrentAssemblyForUnion}
        handleAssemblyChange={handleAssemblyChange}
        getAddonImageUrl={getAddonImageUrl}
        handleImageError={handleImageError}
        DEFAULT_IMAGE={DEFAULT_IMAGE}
      />

      {/* BLOQUE B: TRABAJOS */}
      <JobsSection
        materialMapFull={materialMapFull}
        activeTabIndex={activeTabIndex}
        handlePieceSelect={handlePieceSelect}
        activePiece={activePiece}
        materialCategoryMap={materialCategoryMap}
        jobAddons={jobAddons}
        handleRemoveJob={handleRemoveJob}
        handleUpdateJobMeasurement={handleUpdateJobMeasurement}
        handleAddJob={handleAddJob}
        getAddonImageUrl={getAddonImageUrl}
        handleImageError={handleImageError}
      />
    </Box>
  );
};
