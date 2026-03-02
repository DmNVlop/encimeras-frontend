// --- TIPOS ---
import type { CalculationResponse } from "@/interfases/price.interfase";
// ICustomer eliminado - Selección en el carrito

// --- SUB-COMPONENTES EXTRAÍDOS ---
import { SummaryHeader } from "./components/step5/SummaryHeader";
import { BreakdownSection } from "./components/step5/BreakdownSection";
import { RequesterInfo } from "./components/step5/RequesterInfo";
import { SummaryActions } from "./components/step5/SummaryActions";
// SuccessView eliminado - El envío se hace desde el carrito

// =============================================================================
// COMPONENTE WizardStep5_Summary
// =============================================================================

import React, { useState } from "react";
import { Box, Dialog, DialogTitle, IconButton, DialogContent, Snackbar, Alert, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

// --- VALIDACIÓN ---
import { validateAssemblies } from "@/utils/quoteValidation";

// --- CONTEXTO Y SERVICIOS ---
import { useQuoteState, useQuoteDispatch } from "@/context/QuoteContext";
import { useAuth } from "@/context/AuthProvider";
import { useCart } from "@/context/CartContext"; // Nuevo
import { post } from "@/services/api.service";
import { draftsApi } from "@/services/drafts.service";

// --- COMPONENTES COMUNES ---
import { ApiErrorFeedback } from "@/pages/public/common/ApiErrorFeedback";
import { DraftNamingDialog } from "../components/DraftNamingDialog";

// --- MAPPERS ---
import { mapStateToCoreDto, mapStateToUiState } from "@/utils/coreMapper";

export const WizardStep5_Summary: React.FC = () => {
  const { user } = useAuth();

  const {
    mainPieces,
    selectedShapeId,
    isCalculating,
    calculationResult,
    error,
    currentDraftId,
    currentDraftName,
    wizardTempMaterial,
    currentCartItemId,
    currentCartItemName,
    selectedCustomer,
  } = useQuoteState();
  const dispatch = useQuoteDispatch();

  const { addToCart, updateCartItem } = useCart(); // Nuevo

  // --- ESTADOS PARA BORRADORES ---
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ESTADO PARA EL MODAL 3D
  const [open3D, setOpen3D] = useState(false);

  // --- MODAL GUARDAR BORRADOR ---
  const [openSaveModal, setOpenSaveModal] = useState(false);
  const [openCartModal, setOpenCartModal] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [tempDraftName, setTempDraftName] = useState("");

  // --- AUTOMATIC CUSTOMER RESOLUTION REMOVED (Handled in Cart) ---

  // --- REMOVED AUTO-CALCULATE ON CUSTOMER CHANGE ---
  // We now force the user to click "Calculate" to see the impact.

  // ===========================================================================
  // 🛠️ HELPER: Transformar datos del Contexto (Anidados) a API (Planos)
  // ===========================================================================
  const mapStateToApiPayload = (pieces: typeof mainPieces) => {
    return {
      mainPieces: pieces.map((piece) => ({
        // Copiamos IDs y atributos
        id: piece.id,
        materialId: piece.materialId,
        selectedAttributes: piece.selectedAttributes,

        // 🔥 CORRECCIÓN CRÍTICA: Aplanamos las medidas
        length_mm: piece.measurements.length_mm,
        width_mm: piece.measurements.width_mm,

        // Mapeamos los addons asegurando que usamos 'code'
        appliedAddons: piece.appliedAddons.map((addon) => ({
          code: addon.code,
          measurements: addon.measurements,
          quantity: addon.measurements.quantity || 1,
        })),
      })),
      customerId: selectedCustomer?._id || null,
    };
  };

  // ---------------------------------------------------------------------------
  // HANDLER: CALCULAR PRECIO (POST /quotes/calculate)
  // ---------------------------------------------------------------------------
  const handleCalculate = async () => {
    dispatch({ type: "CALCULATION_START" });

    if (mainPieces.length === 0) {
      dispatch({ type: "CALCULATION_ERROR", payload: { error: "No hay piezas definidas." } });
      return;
    }

    // --- VALIDACIÓN DE UNIONES ---
    const assemblyValidation = validateAssemblies(mainPieces);
    if (!assemblyValidation.isValid) {
      dispatch({
        type: "CALCULATION_ERROR",
        payload: { error: assemblyValidation.error || "Faltan uniones por seleccionar. Revisa el paso 3." },
      });
      return;
    }

    try {
      // Usamos el helper para generar el payload
      const payload = mapStateToApiPayload(mainPieces);

      // Usamos 'post' en lugar de 'create' para ser semánticamente correctos
      const response = await post<CalculationResponse>("/quotes/calculate", payload);

      dispatch({
        type: "CALCULATION_SUCCESS",
        payload: { results: response },
      });
    } catch (err: any) {
      console.error("Calculation Error:", err);
      // const errorMsg = err.response?.data?.message || "Error al conectar con el servidor de cálculo.";
      dispatch({ type: "CALCULATION_ERROR", payload: { error: err } });
    }
  };

  // ---------------------------------------------------------------------------
  // HANDLER: GUARDAR/ACTUALIZAR BORRADOR
  // ---------------------------------------------------------------------------
  const handleSaveDraft = async (nameToSave: string) => {
    setIsSavingDraft(true);
    setSaveMessage(null);

    const state = { mainPieces, selectedShapeId, wizardTempMaterial } as any;
    const payload = {
      name: nameToSave,
      core: mapStateToCoreDto(state),
      uiState: mapStateToUiState(state),
    };

    try {
      if (currentDraftId) {
        // ACTUALIZAR EXISTENTE (PUT)
        await draftsApi.update(currentDraftId, payload);
        setSaveMessage({ type: "success", text: "Presupuesto actualizado." });
      } else {
        // CREAR NUEVO (POST)
        const response = await draftsApi.create(payload);
        const newId = response.data.id;

        dispatch({ type: "SET_DRAFT_ID", payload: newId });
        dispatch({ type: "SET_DRAFT_NAME", payload: nameToSave });

        // Actualizamos URL para permitir F5
        const newUrl = `${window.location.pathname}?draftId=${newId}`;
        window.history.replaceState({ path: newUrl }, "", newUrl);

        setSaveMessage({ type: "success", text: "Borrador guardado correctamente." });
      }
    } catch (err) {
      console.error("Save Draft Error:", err);
      setSaveMessage({ type: "error", text: "No se pudo guardar el borrador." });
    } finally {
      setIsSavingDraft(false);
    }
  };

  // ---------------------------------------------------------------------------
  // HANDLER: AÑADIR AL CARRITO
  // ---------------------------------------------------------------------------
  const handleAddToCart = async (alias: string) => {
    setIsAddingToCart(true);
    try {
      const state = { mainPieces, selectedShapeId, wizardTempMaterial } as any;
      const payload = {
        customName: alias,
        core: mapStateToCoreDto(state),
        uiState: mapStateToUiState(state),
        draftId: currentDraftId || undefined,
      };

      if (currentCartItemId) {
        await updateCartItem(currentCartItemId, payload);
        setSaveMessage({ type: "success", text: "Ítem del carrito actualizado." });
      } else {
        await addToCart(payload);
        setSaveMessage({ type: "success", text: "Añadido al carrito correctamente." });
      }
    } catch (err: any) {
      console.error("Add to Cart Error:", err);
      setSaveMessage({ type: "error", text: "No se pudo añadir al carrito." });
    } finally {
      setIsAddingToCart(false);
    }
  };

  // ---------------------------------------------------------------------------
  // RENDER PRINCIPAL
  // ---------------------------------------------------------------------------
  return (
    <Box sx={{ pb: 4 }}>
      {/* CABECERA CON TÍTULO Y ACCIONES */}
      <SummaryHeader
        isSavingDraft={isSavingDraft}
        isCalculating={isCalculating}
        isAddingToCart={isAddingToCart}
        canAction={mainPieces.length > 0}
        onSaveDraft={() => {
          setTempDraftName(currentDraftName || "");
          setOpenSaveModal(true);
        }}
        onCalculate={handleCalculate}
        onAddToCart={() => {
          setTempDraftName(currentDraftName || (currentCartItemName as string) || "");
          setOpenCartModal(true);
        }}
        isEditingCart={!!currentCartItemId}
      />

      {/* Snackbar para el feedback de guardado */}
      <Snackbar open={!!saveMessage} autoHideDuration={4000} onClose={() => setSaveMessage(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={saveMessage?.type || "info"} variant="filled" sx={{ borderRadius: 2 }}>
          {saveMessage?.text}
        </Alert>
      </Snackbar>

      {/* FEEDBACK DE ERROR SI FALLA EL CÁLCULO */}
      {error && (
        <Box sx={{ mb: 4 }}>
          <ApiErrorFeedback error={error} title="No se pudo calcular el presupuesto" onRetry={handleCalculate} />
        </Box>
      )}

      {/* DESGLOSE Y PROYECTO */}
      <BreakdownSection
        calculationResult={calculationResult as CalculationResponse}
        wizardTempMaterial={wizardTempMaterial}
        mainPieces={mainPieces}
        selectedShapeId={selectedShapeId}
      />

      {calculationResult && <RequesterInfo user={user} submitError={null} />}

      {/* BOTONES DE ACCIÓN AL FINAL (SOLO SI HAY RESULTADOS) */}
      {calculationResult && (
        <Box sx={{ mt: 5, pt: 3, borderTop: "1px solid", borderColor: "divider", display: "flex", justifyContent: "flex-end" }}>
          <SummaryActions
            isSavingDraft={isSavingDraft}
            isCalculating={isCalculating}
            isAddingToCart={isAddingToCart}
            canAction={mainPieces.length > 0}
            onSaveDraft={() => {
              setTempDraftName(currentDraftName || "");
              setOpenSaveModal(true);
            }}
            onCalculate={handleCalculate}
            onAddToCart={() => {
              setTempDraftName(currentDraftName || (currentCartItemName as string) || "");
              setOpenCartModal(true);
            }}
            isEditingCart={!!currentCartItemId}
          />
        </Box>
      )}

      {/* --- MODAL DEL VISOR 3D --- */}
      <Dialog open={open3D} onClose={() => setOpen3D(false)} maxWidth="lg" fullWidth PaperProps={{ sx: { height: "80vh" } }}>
        <DialogTitle sx={{ m: 0, p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6">Previsualización 3D</Typography>
          <IconButton aria-label="close" onClick={() => setOpen3D(false)} sx={{ color: (theme) => theme.palette.grey[500] }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, overflow: "hidden" }}>
          {/* Aquí iría el visor 3D */}
        </DialogContent>
      </Dialog>

      {/* --- MODAL PARA GUARDAR BORRADOR CON NOMBRE --- */}
      <DraftNamingDialog
        open={openSaveModal}
        onClose={() => setOpenSaveModal(false)}
        onConfirm={(name) => {
          handleSaveDraft(name);
          setOpenSaveModal(false);
        }}
        isSaving={isSavingDraft}
        initialName={tempDraftName}
      />

      {/* --- MODAL PARA AÑADIR AL CARRITO CON ALIAS --- */}
      <DraftNamingDialog
        open={openCartModal}
        onClose={() => setOpenCartModal(false)}
        onConfirm={(name) => {
          handleAddToCart(name);
          setOpenCartModal(false);
        }}
        isSaving={isAddingToCart}
        initialName={tempDraftName}
        title="Añadir al Carrito"
        subtitle="Asigna un nombre a esta configuración (ej: Isla, Cocina Principal) para identificarla en tu carrito."
      />
    </Box>
  );
};
