import React, { useState, useEffect, useMemo } from "react";
import { Box, CircularProgress, Alert, Fade } from "@mui/material";

// --- IMPORTACIONES ---
import { useQuoteDispatch, useQuoteState } from "@/context/QuoteContext";
import { get } from "@/services/api.service";

import type { Material } from "@/interfases/materials.interfase";
import type { Addon } from "@/interfases/addon.interfase";
import type { AppliedAddon } from "@/context/QuoteInterfases";

import { ProjectPiecesSelector } from "@/pages/public/components/ProjectPiecesSelector";

// Nuevos componentes separados
import { ComplementsHeader } from "./components/step4/ComplementsHeader";
import { AppliedComplementsSection } from "./components/step4/AppliedComplementsSection";
import { AvailableComplementsSection } from "./components/step4/AvailableComplementsSection";

// --- CONSTANTES VISUALES ---
const IMAGE_PATH = "/addons";
const DEFAULT_IMAGE = `${IMAGE_PATH}/default_assembly.jpg`;

// --- COMPONENTE PRINCIPAL ---

export const WizardStep4_Complements: React.FC = () => {
  const { mainPieces } = useQuoteState();
  const dispatch = useQuoteDispatch();

  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [allAddons, setAllAddons] = useState<Addon[]>([]);
  const [allMaterials, setAllMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Carga de Datos
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [addonsData, materialsData] = await Promise.all([get<Addon[]>("/addons"), get<Material[]>("/materials")]);
        setAllAddons(addonsData);
        setAllMaterials(materialsData);
      } catch (error) {
        console.error("Error loading step 4 data", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // 2. Memos
  const complementAddons = useMemo(() => allAddons.filter((a) => a.category === "COMPLEMENTO"), [allAddons]);

  // Mapa de materiales completo (ID -> Objeto Material) para el selector visual
  const materialMapFull = useMemo(() => {
    return allMaterials.reduce(
      (acc, mat) => {
        acc[mat._id] = mat;
        return acc;
      },
      {} as Record<string, Material>,
    );
  }, [allMaterials]);

  // Mapa de categorías (ID -> string) para filtrar complementos compatibles
  const materialCategoryMap = useMemo(() => {
    return allMaterials.reduce(
      (acc, mat) => {
        acc[mat._id] = mat.category;
        return acc;
      },
      {} as Record<string, string>,
    );
  }, [allMaterials]);

  // --- HANDLERS ---

  const handlePieceSelect = (index: number) => {
    setActiveTabIndex(index);
    dispatch({ type: "SET_ACTIVE_PIECE", payload: { index } });
  };

  const handleAddAddon = (pieceIndex: number, addon: Addon) => {
    const piece = mainPieces[pieceIndex];
    const defaultMeasurements: Record<string, number> = {};

    if (addon.requiredMeasurements.includes("length_ml")) {
      defaultMeasurements["length_ml"] = piece.measurements.length_mm / 1000;
    }

    addon.requiredMeasurements.forEach((m) => {
      if (defaultMeasurements[m] === undefined) {
        defaultMeasurements[m] = m === "quantity" ? 1 : 0;
      }
    });

    const newAddon: AppliedAddon = {
      code: addon.code,
      measurements: defaultMeasurements,
    };

    dispatch({
      type: "ADD_ADDON_TO_PIECE",
      payload: { pieceIndex, addon: newAddon },
    });
  };

  const handleRemoveAddon = (pieceIndex: number, addonIndex: number) => {
    dispatch({
      type: "REMOVE_ADDON_FROM_PIECE",
      payload: { pieceIndex, addonIndex },
    });
  };

  const handleUpdateMeasurement = (pieceIndex: number, addonIndexInPiece: number, field: string, val: string) => {
    const numVal = parseFloat(val);
    const finalVal = isNaN(numVal) ? 0 : numVal;

    const currentMeas = mainPieces[pieceIndex].appliedAddons[addonIndexInPiece].measurements;
    const newMeas = { ...currentMeas, [field]: finalVal };

    dispatch({
      type: "UPDATE_ADDON_IN_PIECE",
      payload: {
        pieceIndex,
        addonIndex: addonIndexInPiece,
        data: { measurements: newMeas },
      },
    });
  };

  // --- UTILIDADES DE IMAGEN ---
  const getImageUrl = (addon: Addon | undefined) => {
    if (!addon) return DEFAULT_IMAGE;
    if (addon.imageUrl) return addon.imageUrl;
    return `${IMAGE_PATH}/${addon.code}.jpg`;
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (e.currentTarget.src !== window.location.origin + DEFAULT_IMAGE) {
      e.currentTarget.src = DEFAULT_IMAGE;
    }
  };

  // --- RENDER ---

  if (isLoading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );

  if (mainPieces.length === 0) return <Alert severity="warning">Define la forma primero.</Alert>;

  const activePiece = mainPieces[activeTabIndex];

  return (
    <Box sx={{ pb: 4 }}>
      <ComplementsHeader />

      <ProjectPiecesSelector materialsMap={materialMapFull} activeIndex={activeTabIndex} onPieceSelect={handlePieceSelect} />

      {activePiece && (
        <Fade in={true} key={activePiece.id} timeout={400}>
          <Box sx={{ mt: 2, minHeight: 300 }}>
            {(() => {
              const matCategory = materialCategoryMap[activePiece.materialId!] || "";

              const appliedComplements = activePiece.appliedAddons
                .map((addon, idx) => ({ ...addon, originalIndex: idx }))
                .filter((addon) => complementAddons.some((def) => def.code === addon.code));

              const compatibleComplements = complementAddons.filter((c) => c.allowedMaterialCategories.includes(matCategory));

              return (
                <>
                  <AppliedComplementsSection
                    activeTabIndex={activeTabIndex}
                    appliedComplements={appliedComplements}
                    complementAddons={complementAddons}
                    getImageUrl={getImageUrl}
                    handleImageError={handleImageError}
                    handleRemoveAddon={handleRemoveAddon}
                    handleUpdateMeasurement={handleUpdateMeasurement}
                  />

                  <AvailableComplementsSection
                    activeTabIndex={activeTabIndex}
                    compatibleComplements={compatibleComplements}
                    getImageUrl={getImageUrl}
                    handleImageError={handleImageError}
                    handleAddAddon={handleAddAddon}
                  />
                </>
              );
            })()}
          </Box>
        </Fade>
      )}
    </Box>
  );
};
