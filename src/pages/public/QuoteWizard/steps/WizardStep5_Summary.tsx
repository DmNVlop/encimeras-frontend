// --- TIPOS ---
import type { CalculationResponse } from "@/interfases/price.interfase";
import type { ICustomer } from "@/interfases/customer.interfase";

// --- SUB-COMPONENTES EXTRAÍDOS ---
import { SummaryHeader } from "./components/step5/SummaryHeader";
import { CustomerSelection } from "./components/step5/CustomerSelection";
import { BreakdownSection } from "./components/step5/BreakdownSection";
import { RequesterInfo } from "./components/step5/RequesterInfo";
import { SuccessView } from "./components/step5/SuccessView";

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
import { post, get } from "@/services/api.service";
import { draftsApi } from "@/services/drafts.service";

// --- COMPONENTES COMUNES ---
import { ApiErrorFeedback } from "@/pages/public/common/ApiErrorFeedback";
import { DraftNamingDialog } from "../components/DraftNamingDialog";

// --- MAPPERS ---
import { mapStateToCoreDto, mapStateToUiState } from "@/utils/coreMapper";

export const WizardStep5_Summary: React.FC = () => {
  const { user } = useAuth();

  const { mainPieces, selectedShapeId, isCalculating, calculationResult, error, currentDraftId, currentDraftName, wizardTempMaterial } = useQuoteState();
  const dispatch = useQuoteDispatch();

  // Estado local para el envío final
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { addToCart } = useCart(); // Nuevo

  // --- ESTADOS PARA BORRADORES ---
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ESTADO PARA EL MODAL 3D
  const [open3D, setOpen3D] = useState(false);

  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(null);

  // --- MODAL GUARDAR BORRADOR ---
  const [openSaveModal, setOpenSaveModal] = useState(false);
  const [openCartModal, setOpenCartModal] = useState(false); // Nuevo
  const [isAddingToCart, setIsAddingToCart] = useState(false); // Nuevo
  const [tempDraftName, setTempDraftName] = useState("");
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  React.useEffect(() => {
    const fetchCustomers = async () => {
      setLoadingCustomers(true);
      try {
        const data = await get<ICustomer[]>("/customers");
        setCustomers(data);
      } catch (err) {
        console.error("Error fetching customers for wizard:", err);
      } finally {
        setLoadingCustomers(false);
      }
    };
    fetchCustomers();
  }, []);

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
  // HANDLER: ENVIAR PEDIDO (POST /quotes)
  // ---------------------------------------------------------------------------
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setSubmitSuccess(false);

    try {
      setSubmitError(null);
      // PASO 1: Garantizar que existe un Borrador actualizado
      let activeDraftId = currentDraftId;

      // Usamos los mappers para generar el payload alineado al backend
      const state = { mainPieces, selectedShapeId, wizardTempMaterial } as any; // Cast temporal para el mapper
      const currentPayload = {
        name: currentDraftName,
        core: mapStateToCoreDto(state),
        uiState: mapStateToUiState(state),
      };

      if (activeDraftId) {
        // A) Si YA existe: Lo actualizamos silenciosamente para asegurar que
        // lo que se convierte en orden es EXACTAMENTE lo que hay en pantalla.
        await draftsApi.update(activeDraftId, currentPayload);
      } else {
        // B) Si NO existe: Lo creamos en segundo plano
        const draftRes = await draftsApi.create(currentPayload);
        activeDraftId = draftRes.data.id;
        // Importante: Actualizamos el contexto por si el usuario se queda aquí
        dispatch({ type: "SET_DRAFT_ID", payload: activeDraftId });
      }

      // PASO 2: Convertir ese Borrador en Orden Oficial
      // Usamos el email del usuario logueado
      const orderRes = await draftsApi.convertToOrder({
        draftId: activeDraftId,
        customerId: user?.email || user?.username || "usuario-autenticado",
      });

      console.log("Orden Creada:", orderRes.data.orderNumber);
      setSubmitSuccess(true);
    } catch (err: any) {
      console.error("Submit Error:", err);
      const errorMessage = err.response?.data?.message || "Hubo un error al procesar tu pedido. Por favor, intenta de nuevo.";
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
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

      await addToCart(payload);
      setSaveMessage({ type: "success", text: "Añadido al carrito correctamente." });
    } catch (err: any) {
      console.error("Add to Cart Error:", err);
      setSaveMessage({ type: "error", text: "No se pudo añadir al carrito." });
    } finally {
      setIsAddingToCart(false);
    }
  };

  // ---------------------------------------------------------------------------
  // HANDLER: REINICIAMOS EL PRESUPUESTADOR
  // ---------------------------------------------------------------------------
  const handleStartNew = () => {
    // 1. Obtenemos la ruta base sin parámetros (ej. "/presupuestador" en lugar de "/presupuestador?draftId=xyz")
    const basePath = window.location.pathname;

    // 2. Forzamos una navegación nativa del navegador.
    // Esto hace dos cosas:
    // a) Elimina el query param ?draftId=...
    // b) Provoca un refresco real (Hard Reload), lo que limpia la memoria RAM,
    //    el Contexto de React y el contexto WebGL de BabylonJS.
    window.location.href = basePath;
  };

  // ---------------------------------------------------------------------------
  // RENDER PRINCIPAL
  // ---------------------------------------------------------------------------
  if (submitSuccess) {
    return <SuccessView onStartNew={handleStartNew} />;
  }

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
          setTempDraftName(currentDraftName || "");
          setOpenCartModal(true);
        }}
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

      {/* SELECCIÓN DE CLIENTE */}
      <CustomerSelection
        customers={customers}
        selectedCustomer={selectedCustomer}
        loadingCustomers={loadingCustomers}
        onCustomerChange={(newValue) => {
          setSelectedCustomer(newValue);
          dispatch({ type: "CLEAR_CALCULATION" });
        }}
      />

      {/* DESGLOSE Y PROYECTO */}
      <BreakdownSection
        calculationResult={calculationResult as CalculationResponse}
        wizardTempMaterial={wizardTempMaterial}
        mainPieces={mainPieces}
        selectedShapeId={selectedShapeId}
      />

      {/* DATOS DE USUARIO Y ENVÍO FINAL */}
      {calculationResult && (
        <RequesterInfo
          user={user}
          isSubmitting={isSubmitting}
          submitError={submitError}
          canSubmit={!!selectedCustomer && !!calculationResult}
          onSubmit={handleFinalSubmit}
        />
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
