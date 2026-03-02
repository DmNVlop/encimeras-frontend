import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuoteDispatch, useQuoteState } from "@/context/QuoteContext";
import { get } from "@/services/api.service";
import type { Material } from "@/interfases/materials.interfase";
import type { Addon } from "@/interfases/addon.interfase";
import type { AppliedAddon } from "@/context/QuoteInterfases";

// --- CONSTANTES VISUALES ---
export const IMAGE_PATH = "/addons";
export const DEFAULT_IMAGE = `${IMAGE_PATH}/default_assembly.jpg`;

export const useWizardStep3 = () => {
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
        console.error("Error loading step 3 data", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // 2. Memos
  const assemblyAddons = useMemo(() => allAddons.filter((a) => a.category === "ENSAMBLAJE"), [allAddons]);
  const jobAddons = useMemo(() => allAddons.filter((a) => a.category === "TRABAJO"), [allAddons]);

  const materialMapFull = useMemo(() => {
    return allMaterials.reduce(
      (acc, mat) => {
        acc[mat._id] = mat;
        return acc;
      },
      {} as Record<string, Material>,
    );
  }, [allMaterials]);

  const materialCategoryMap = useMemo(() => {
    return allMaterials.reduce(
      (acc, mat) => {
        acc[mat._id] = mat.category;
        return acc;
      },
      {} as Record<string, string>,
    );
  }, [allMaterials]);

  // --- LOGICA DE IMÁGENES ---
  const getAddonImageUrl = useCallback((addon: Addon | undefined) => {
    if (!addon) return DEFAULT_IMAGE;
    if (addon.imageUrl) return addon.imageUrl;
    return `${IMAGE_PATH}/${addon.code}.jpg`;
  }, []);

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (e.currentTarget.src !== window.location.origin + DEFAULT_IMAGE) {
      e.currentTarget.src = DEFAULT_IMAGE;
    }
  }, []);

  // --- HANDLERS ---
  const getCurrentAssemblyForUnion = useCallback(
    (targetPieceIndex: number) => {
      if (!mainPieces[targetPieceIndex]) return "";
      const piece = mainPieces[targetPieceIndex];
      const found = piece.appliedAddons.find((applied) => assemblyAddons.some((a) => a.code === applied.code));
      return found ? found.code : "";
    },
    [mainPieces, assemblyAddons],
  );

  const handleAssemblyChange = useCallback(
    (unionIndex: number, addonCode: string) => {
      const targetPieceIndex = unionIndex + 1;
      const piece = mainPieces[targetPieceIndex];
      const existingAssemblyIndex = piece.appliedAddons.findIndex((applied) => assemblyAddons.some((a) => a.code === applied.code));

      if (existingAssemblyIndex !== -1) {
        dispatch({
          type: "REMOVE_ADDON_FROM_PIECE",
          payload: {
            pieceIndex: targetPieceIndex,
            addonIndex: existingAssemblyIndex,
          },
        });
      }

      if (!addonCode) return;

      const addonDef = assemblyAddons.find((a) => a.code === addonCode);
      if (addonDef) {
        const defaultMeasurements: Record<string, number> = {};
        addonDef.requiredMeasurements.forEach((m) => (defaultMeasurements[m] = m === "quantity" ? 1 : 0));
        dispatch({
          type: "ADD_ADDON_TO_PIECE",
          payload: {
            pieceIndex: targetPieceIndex,
            addon: {
              code: addonDef.code,
              measurements: defaultMeasurements,
              category: addonDef.category,
            },
          },
        });
      }
    },
    [mainPieces, assemblyAddons, dispatch],
  );

  const handlePieceSelect = useCallback(
    (index: number) => {
      setActiveTabIndex(index);
      dispatch({ type: "SET_ACTIVE_PIECE", payload: { index } });
    },
    [dispatch],
  );

  const handleAddJob = useCallback(
    (pieceIndex: number, addon: Addon) => {
      const defaultMeasurements: Record<string, number> = {};
      if (addon.requiredMeasurements.includes("length_ml")) {
        defaultMeasurements["length_ml"] = 1;
      }
      addon.requiredMeasurements.forEach((m) => {
        if (defaultMeasurements[m] === undefined) {
          defaultMeasurements[m] = m === "quantity" ? 1 : 0;
        }
      });
      const newAddon: AppliedAddon = {
        code: addon.code,
        measurements: defaultMeasurements,
        category: addon.category,
      };
      dispatch({
        type: "ADD_ADDON_TO_PIECE",
        payload: { pieceIndex, addon: newAddon },
      });
    },
    [dispatch],
  );

  const handleRemoveJob = useCallback(
    (pieceIndex: number, addonIndex: number) => {
      dispatch({
        type: "REMOVE_ADDON_FROM_PIECE",
        payload: { pieceIndex, addonIndex },
      });
    },
    [dispatch],
  );

  const handleUpdateJobMeasurement = useCallback(
    (pIdx: number, addonIndexInPiece: number, field: string, val: string) => {
      const numVal = parseFloat(val);
      const finalVal = isNaN(numVal) ? 0 : numVal;
      const currentMeas = mainPieces[pIdx].appliedAddons[addonIndexInPiece].measurements;
      const newMeas = { ...currentMeas, [field]: finalVal };

      dispatch({
        type: "UPDATE_ADDON_IN_PIECE",
        payload: {
          pieceIndex: pIdx,
          addonIndex: addonIndexInPiece,
          data: { measurements: newMeas },
        },
      });
    },
    [mainPieces, dispatch],
  );

  return {
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
  };
};
