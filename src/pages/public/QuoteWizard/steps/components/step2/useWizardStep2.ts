import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuoteDispatch, useQuoteState } from "@/context/QuoteContext";
import { get } from "@/services/api.service";
import type { Material } from "@/interfases/materials.interfase";
import type { ShapeVariation, SelectionState } from "@/interfases/shape-variation.interfase";
import type { MainPiece } from "@/context/QuoteInterfases";
import { shapeVariations } from "@/pages/public/common/shapes-step2";
import type { MaterialConfirmationPayload, SelectedAttributes } from "@/context/QuoteInterfases";
import { type ConnectionType } from "@/pages/public/common/Icons/ConnectionTypeIcons";

export const useWizardStep2 = () => {
  const { wizardTempMaterial, mainPieces, selectedShapeId } = useQuoteState();
  const dispatch = useQuoteDispatch();

  const [materialsList, setMaterialsList] = useState<Material[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [editingPieceIndex, setEditingPieceIndex] = useState<number | null>(null);
  const [isChangeMaterialModalOpen, setIsChangeMaterialModalOpen] = useState(false);
  const [materialToChange, setMaterialToChange] = useState<Material | null>(null);
  const [initialSelectionForChange, setInitialSelectionForChange] = useState<SelectionState | undefined>(undefined);
  const [isAddPieceModalOpen, setIsAddPieceModalOpen] = useState(false);
  const [backupMainPieces, setBackupMainPieces] = useState<MainPiece[] | null>(null);
  const [isShapeSelectionPending, setIsShapeSelectionPending] = useState(false);

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
      const pieceIndex = payload.pieceIndex ?? editingPieceIndex;
      if (pieceIndex === null || pieceIndex === undefined) return;

      const currentPiece = mainPieces[pieceIndex];
      if (!currentPiece) return;

      dispatch({
        type: "UPDATE_MAIN_PIECE",
        payload: {
          pieceIndex,
          data: {
            materialId: payload.materialId,
            selectedAttributes: payload.selectedAttributes,
            layout: {
              order: currentPiece.layout?.order ?? pieceIndex,
              rotation: currentPiece.layout?.rotation ?? 0,
              connectionType: payload.connectionType ?? currentPiece.layout?.connectionType ?? "LINEAR",
            },
          },
        },
      });

      setIsChangeMaterialModalOpen(false);
      setIsAddPieceModalOpen(false);
      setEditingPieceIndex(null);
      setMaterialToChange(null);
      setInitialSelectionForChange(undefined);
    },
    [dispatch, editingPieceIndex, mainPieces],
  );

  const handleResetShape = useCallback(() => {
    // Backup current pieces instead of immediately resetting
    setBackupMainPieces(mainPieces);
    setIsShapeSelectionPending(true);
  }, [dispatch, mainPieces]);

  const handleCancelShapeSelection = useCallback(() => {
    // Restore backed up pieces if available
    if (backupMainPieces !== null) {
      dispatch({
        type: "SET_MAIN_PIECES",
        payload: backupMainPieces,
      });
    }
    setBackupMainPieces(null);
    setIsShapeSelectionPending(false);
  }, [backupMainPieces, dispatch]);

  const handleCloseModal = useCallback(() => {
    setIsChangeMaterialModalOpen(false);
    setEditingPieceIndex(null);
    setMaterialToChange(null);
    setInitialSelectionForChange(undefined);
  }, []);

  const handleOpenAddPieceModal = useCallback(() => {
    setIsAddPieceModalOpen(true);
  }, []);

  const handleCloseAddPieceModal = useCallback(() => {
    setIsAddPieceModalOpen(false);
  }, []);

  const handleAddPiece = useCallback(
    (payload: {
      materialId: string;
      selectedAttributes: SelectedAttributes;
      measurements: { length_mm: number; width_mm: number };
      connectionType: ConnectionType;
    }) => {
      dispatch({
        type: "ADD_EXTRA_PIECE",
        payload,
      });
      setIsAddPieceModalOpen(false);
    },
    [dispatch],
  );

  const handleRemovePiece = useCallback(
    (pieceIndex: number) => {
      dispatch({
        type: "REMOVE_PIECE",
        payload: { pieceIndex },
      });
    },
    [dispatch],
  );

  const handleReorderPiece = useCallback(
    (fromIndex: number, toIndex: number) => {
      dispatch({
        type: "UPDATE_PIECE_ORDER",
        payload: { fromIndex, toIndex },
      });
    },
    [dispatch],
  );

  const handleConnectionTypeChange = useCallback(
    (pieceIndex: number, connectionType: ConnectionType) => {
      const currentPiece = mainPieces[pieceIndex];
      if (!currentPiece.layout) return;

      dispatch({
        type: "UPDATE_MAIN_PIECE",
        payload: {
          pieceIndex,
          data: {
            layout: {
              ...currentPiece.layout,
              connectionType,
            },
          },
        },
      });
    },
    [dispatch, mainPieces],
  );

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
    backupMainPieces,
    isShapeSelectionPending,
  };
};
