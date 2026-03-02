import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuoteDispatch, useQuoteState } from "@/context/QuoteContext";
import { get } from "@/services/api.service";
import type { Material } from "@/interfases/materials.interfase";
import type { ShapeVariation, SelectionState } from "@/interfases/shape-variation.interfase";
import { shapeVariations } from "@/pages/public/common/shapes-step2";
import type { MaterialConfirmationPayload } from "@/context/QuoteInterfases";

export const useWizardStep2 = () => {
  const { wizardTempMaterial, mainPieces, selectedShapeId } = useQuoteState();
  const dispatch = useQuoteDispatch();

  const [materialsList, setMaterialsList] = useState<Material[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [editingPieceIndex, setEditingPieceIndex] = useState<number | null>(null);
  const [isChangeMaterialModalOpen, setIsChangeMaterialModalOpen] = useState(false);
  const [materialToChange, setMaterialToChange] = useState<Material | null>(null);
  const [initialSelectionForChange, setInitialSelectionForChange] = useState<SelectionState | undefined>(undefined);

  // Carga inicial de materiales
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setLoadingMaterials(true);
        const data = await get<Material[]>("/materials");
        setMaterialsList(data);
      } catch (error) {
        console.error("Error al cargar materiales:", error);
      } finally {
        setLoadingMaterials(false);
      }
    };
    fetchMaterials();
  }, []);

  const currentShapeVariation = useMemo(() => shapeVariations.find((v) => v.id === selectedShapeId), [selectedShapeId]);

  const handleSelectVariation = useCallback(
    (variation: ShapeVariation) => {
      if (!wizardTempMaterial) return;

      dispatch({
        type: "SET_SHAPE_VARIATION_AND_CREATE_PIECES",
        payload: {
          variationCode: variation.id,
          count: variation.count,
          defaultMeasurements: variation.defaultMeasurements,
          piecesLayout: variation.piecesLayout,
        },
      });
    },
    [dispatch, wizardTempMaterial],
  );

  const handleMeasureChange = useCallback(
    (pieceIndex: number, field: "length_mm" | "width_mm", value: string) => {
      const currentPiece = mainPieces[pieceIndex];
      const newMeasurements = {
        ...currentPiece.measurements,
        [field]: parseInt(value, 10) || 0,
      };

      dispatch({
        type: "UPDATE_PIECE_MEASUREMENTS",
        payload: {
          pieceIndex: pieceIndex,
          measurements: newMeasurements,
        },
      });
    },
    [dispatch, mainPieces],
  );

  const handleOpenChangeMaterialModal = useCallback(
    (pieceIndex: number) => {
      const piece = mainPieces[pieceIndex];
      const materialDef = materialsList.find((m) => m._id === piece.materialId);
      if (!materialDef) return;

      setEditingPieceIndex(pieceIndex);
      setMaterialToChange(materialDef);
      setInitialSelectionForChange(piece.selectedAttributes);
      setIsChangeMaterialModalOpen(true);
    },
    [mainPieces, materialsList],
  );

  const handleConfirmMaterialChange = useCallback(
    (payload: MaterialConfirmationPayload) => {
      if (editingPieceIndex === null) return;

      dispatch({
        type: "UPDATE_MAIN_PIECE",
        payload: {
          pieceIndex: editingPieceIndex,
          data: {
            materialId: payload.materialId,
            selectedAttributes: payload.selectedAttributes,
          },
        },
      });

      setIsChangeMaterialModalOpen(false);
      setEditingPieceIndex(null);
      setMaterialToChange(null);
      setInitialSelectionForChange(undefined);
    },
    [dispatch, editingPieceIndex],
  );

  const handleResetShape = useCallback(() => {
    dispatch({ type: "RESET_SHAPE" });
  }, [dispatch]);

  const handleCloseModal = useCallback(() => {
    setIsChangeMaterialModalOpen(false);
    setEditingPieceIndex(null);
    setMaterialToChange(null);
    setInitialSelectionForChange(undefined);
  }, []);

  return {
    wizardTempMaterial,
    mainPieces,
    selectedShapeId,
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
  };
};
