import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuoteState, useQuoteDispatch } from "@/context/QuoteContext";
import { useCart } from "@/context/CartContext";
import { draftsApi } from "@/services/drafts.service";
import { mapStateToCoreDto, mapStateToUiState } from "@/utils/coreMapper";
import type { CartItem } from "@/interfases/cart.interfase";

export const useCartLoadAction = () => {
  const navigate = useNavigate();
  const quoteState = useQuoteState();
  const quoteDispatch = useQuoteDispatch();
  const { addToCart } = useCart();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingCartItem, setPendingCartItem] = useState<CartItem | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const isDirty = quoteState.mainPieces.length > 0 || !!quoteState.wizardTempMaterial;

  const proceedWithLoad = useCallback(
    (item: CartItem) => {
      quoteDispatch({ type: "LOAD_CART_ITEM", payload: item });
      navigate("/quote");
      setIsDialogOpen(false);
      setPendingCartItem(null);
    },
    [quoteDispatch, navigate],
  );

  const initiateLoad = useCallback(
    (item: CartItem) => {
      if (isDirty) {
        setPendingCartItem(item);
        setIsDialogOpen(true);
      } else {
        proceedWithLoad(item);
      }
    },
    [isDirty, proceedWithLoad],
  );

  const handleConflictAction = async (action: "SAVE_TO_CART" | "SAVE_AS_DRAFT" | "DISCARD") => {
    if (!pendingCartItem) return;

    setIsProcessing(true);
    try {
      if (action === "SAVE_TO_CART") {
        const stateToSave = {
          mainPieces: quoteState.mainPieces,
          selectedShapeId: quoteState.selectedShapeId,
          wizardTempMaterial: quoteState.wizardTempMaterial,
        } as any;

        await addToCart({
          customName: quoteState.currentDraftName || quoteState.currentCartItemName || "Diseño en curso",
          core: mapStateToCoreDto(stateToSave),
          uiState: mapStateToUiState(stateToSave),
          draftId: quoteState.currentDraftId || undefined,
        });
      } else if (action === "SAVE_AS_DRAFT") {
        const stateToSave = {
          mainPieces: quoteState.mainPieces,
          selectedShapeId: quoteState.selectedShapeId,
          wizardTempMaterial: quoteState.wizardTempMaterial,
        } as any;

        await draftsApi.create({
          name: quoteState.currentDraftName || "Borrador Automático",
          core: mapStateToCoreDto(stateToSave),
          uiState: mapStateToUiState(stateToSave),
        });
      }

      // En todos los casos (incluyendo DISCARD), procedemos a cargar el nuevo
      proceedWithLoad(pendingCartItem);
    } catch (error) {
      console.error("Error handling cart load conflict:", error);
      // Podrías añadir un toast aquí
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    initiateLoad,
    isDialogOpen,
    closeDialog: () => setIsDialogOpen(false),
    handleConflictAction,
    isProcessing,
    pendingCartItem,
  };
};
