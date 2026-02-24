import React, { useState } from "react";
import { Container, Box, Paper, Button, Typography, useTheme, useMediaQuery, Alert, Backdrop, CircularProgress, Snackbar, AlertTitle } from "@mui/material";
import { QuoteProvider, useQuoteDispatch, useQuoteState } from "@/context/QuoteContext";

// Importar los componentes visuales extraidos
import { WizardHeader } from "./components/WizardHeader";
import { WizardFooter } from "./components/WizardFooter";
import { ResetQuoteDialog } from "./components/ResetQuoteDialog";
import { DraftNamingDialog } from "./components/DraftNamingDialog";
import { GroupLoaderDialog } from "./components/GroupLoaderDialog"; // Nuevo

// Importar los pasos
import { WizardStep1_Materials } from "./steps/WizardStep1_Materials";
import { WizardStep2_ShapeAndMeasures } from "./steps/WizardStep2_ShapeAndMeasures";
import { WizardStep3_JobsAndAssembly } from "./steps/WizardStep3_JobsAndAssembly";
import { WizardStep4_Complements } from "./steps/WizardStep4_Complements";
import { WizardStep5_Summary } from "./steps/WizardStep5_Summary";
import { useLocation, useNavigate } from "react-router-dom";
import { draftsApi } from "@/services/drafts.service";
import { validateAssemblies } from "@/utils/quoteValidation";
import { useCart } from "@/context/CartContext"; // Nuevo

const steps = ["Material", "Forma y Medidas", "Trabajos y Ensamblaje", "Complementos", "Resumen"];

const logo = "/logos/kuuk-logo.png";

const WizardContent: React.FC<{ activeStep: number }> = ({ activeStep }) => {
  switch (activeStep) {
    case 0:
      return <WizardStep1_Materials />;
    case 1:
      return <WizardStep2_ShapeAndMeasures />;
    case 2:
      return <WizardStep3_JobsAndAssembly />;
    case 3:
      return <WizardStep4_Complements />;
    case 4:
      return <WizardStep5_Summary />;
    default:
      return <Typography>Paso desconocido</Typography>;
  }
};

const WizardStepperContent: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { wizardTempMaterial, mainPieces, selectedShapeId, currentDraftId, currentDraftName, calculationResult } = useQuoteState();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showPriceWarning, setShowPriceWarning] = useState(false);

  // --- ESTADOS PARA REINICIO ---
  const [openResetDialog, setOpenResetDialog] = useState(false);
  const [isSavingAndResetting, setIsSavingAndResetting] = useState(false);

  // --- ESTADOS PARA MODAL DE NOMBRE (REINICIO) ---
  const [openNamingModal, setOpenNamingModal] = useState(false);
  const [tempDraftName, setTempDraftName] = useState("");
  const [pendingResetAction, setPendingResetAction] = useState<"SAVE_AS_COPY" | "UPDATE" | null>(null);
  const [showGroupLoader, setShowGroupLoader] = useState(false); // Nuevo
  const [pendingGroupId, setPendingGroupId] = useState<string | null>(null); // Nuevo

  // --- HOOKS ---
  const dispatch = useQuoteDispatch(); // <--- Necesitas exponer esto en tu Context
  const location = useLocation(); // Para leer ?draftId=...
  const navigate = useNavigate();
  const { addItemsFromGroup } = useCart(); // Nuevo

  // Feedback para carga grupal
  const [groupLoadSuccess, setGroupLoadSuccess] = useState(false);
  const [groupLoadError, setGroupLoadError] = useState<string | null>(null);

  // --- EFECTO DE CARGA PARA LEER RUTA ---
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const draftId = params.get("draftId");

    // Si hay ID en la URL y aún no lo hemos cargado en el estado
    if (draftId && !mainPieces.length && !wizardTempMaterial) {
      loadDraft(draftId);
    }
  }, [location.search]);

  const loadDraft = async (id: string) => {
    setIsLoadingDraft(true);
    setLoadError(null);
    try {
      const { data } = await draftsApi.getById(id);

      // Despachamos al reducer
      dispatch({
        type: "LOAD_SAVED_PROJECT",
        payload: {
          ...data.data, // El objeto configuración guardado
          _id: id, // Aseguramos que el ID venga
          recalculated: data.status === "EXPIRED_RECALCULATED",
        },
      });

      // Si fue recalculado, mostramos aviso
      if (data.status === "EXPIRED_RECALCULATED") {
        setShowPriceWarning(true);
      }

      // NUEVO: Verificar si es parte de un grupo
      if ((data.data as any).cartGroupId) {
        setPendingGroupId((data.data as any).cartGroupId);
        setShowGroupLoader(true);
      }

      // Opcional: Saltar directo al resumen o al paso 2
      // setActiveStep(1);
    } catch (error) {
      console.error(error);
      setLoadError("No se pudo recuperar el presupuesto.");
    } finally {
      setIsLoadingDraft(false);
    }
  };

  // --- LOGICA DE VALIDACIÓN PURA ---
  // Verifica si el Paso 1 (Material) está completo
  const isMaterialValid = () => !!wizardTempMaterial;

  // Verifica si el Paso 2 (Forma) está completo y válido
  const isShapeValid = () => {
    if (mainPieces.length === 0) return false;
    // Verifica que no haya medidas en 0
    const invalidMeasure = mainPieces.some((p) => p.measurements.length_mm <= 0 || p.measurements.width_mm <= 0);
    return !invalidMeasure;
  };

  // --- MANEJO DE NAVEGACIÓN LIBRE (CLIC EN STEPPER) ---
  const handleStepClick = (stepIndex: number) => {
    setValidationError(null);

    // 1. Si clickeamos el mismo paso, no hacemos nada
    if (stepIndex === activeStep) return;

    // 2. Si queremos ir hacia atrás (siempre permitido, salvo restricciones lógicas, pero en UX suele ser libre)
    // Nota: Incluso para ir atrás, a veces queremos validar que lo actual no esté roto,
    // pero para "navegación libre" solemos ser permisivos al retroceder.
    if (stepIndex < activeStep) {
      setActiveStep(stepIndex);
      return;
    }

    // 3. Lógica para ir hacia adelante o saltar
    // Para ir al paso 1 (Index 1): Necesitamos Material (Index 0)
    if (stepIndex === 1) {
      if (!isMaterialValid()) {
        setValidationError("Debes seleccionar un material primero.");
        return;
      }
    }

    // Para ir a pasos 2, 3, 4 (Index >= 2): Necesitamos Material (0) Y Forma (1)
    if (stepIndex >= 2) {
      if (!isMaterialValid()) {
        setValidationError("Falta seleccionar el Material (Paso 1).");
        return;
      }
      if (!isShapeValid()) {
        setValidationError("Falta definir la Forma y Medidas (Paso 2).");
        return;
      }
    }

    // Para ir a pasos 3, 4 (Index > 2): Necesitamos Uniones (2)
    if (stepIndex > 2) {
      const v = validateAssemblies(mainPieces);
      if (!v.isValid) {
        setValidationError(v.error || "Falta completar las uniones (Paso 3).");
        return;
      }
    }

    // Si pasa las validaciones, saltamos
    setActiveStep(stepIndex);
  };

  // --- MANEJO DE BOTÓN "SIGUIENTE" ---
  const handleNext = () => {
    setValidationError(null);

    // Validamos el paso ACTUAL antes de dejar avanzar
    if (activeStep === 0 && !isMaterialValid()) {
      setValidationError("Debes seleccionar un material antes de continuar.");
      return;
    }
    if (activeStep === 1 && !isShapeValid()) {
      setValidationError("Debes elegir una forma y medidas válidas.");
      return;
    }
    if (activeStep === 2) {
      const validation = validateAssemblies(mainPieces);
      if (!validation.isValid) {
        setValidationError(validation.error || "Falta completar las uniones.");
        return;
      }
    }

    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setValidationError(null);
    setActiveStep((prev) => prev - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    dispatch({ type: "RESET_WIZARD" });
    navigate(location.pathname, { replace: true });
  };

  // --- HANDLER: GUARDAR COMO NUEVO Y REINICIAR ---
  const handleSaveAsNewAndReset = async (nameToSave: string) => {
    setIsSavingAndResetting(true);
    try {
      const payload = {
        name: nameToSave || currentDraftName,
        configuration: { wizardTempMaterial, mainPieces, selectedShapeId },
        currentPricePoints: calculationResult?.totalPoints || 0,
      };

      await draftsApi.create(payload);

      // Reiniciar después de guardar
      handleReset();
      setOpenResetDialog(false);
    } catch (err) {
      console.error("Save New & Reset Error:", err);
      setLoadError("No se pudo crear el nuevo borrador.");
    } finally {
      setIsSavingAndResetting(false);
    }
  };

  // --- HANDLER: ACTUALIZAR Y REINICIAR ---
  const handleUpdateAndReset = async (nameToSave?: string) => {
    if (!currentDraftId) return;
    setIsSavingAndResetting(true);
    try {
      const payload = {
        name: nameToSave || currentDraftName,
        configuration: { wizardTempMaterial, mainPieces, selectedShapeId },
        currentPricePoints: calculationResult?.totalPoints || 0,
      };

      await draftsApi.update(currentDraftId, payload);

      // Reiniciar después de actualizar
      handleReset();
      setOpenResetDialog(false);
    } catch (err) {
      console.error("Update & Reset Error:", err);
      setLoadError("No se pudo actualizar el borrador.");
    } finally {
      setIsSavingAndResetting(false);
    }
  };

  return (
    <Container
      component="main"
      maxWidth="xl"
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        py: 2,
      }}
    >
      <Paper
        elevation={6}
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "98vh",
          maxHeight: "100%",
          overflow: "hidden",
        }}
      >
        {/* --- A. CABECERA FIJA --- */}
        <WizardHeader
          activeStep={activeStep}
          steps={steps}
          isMobile={isMobile}
          onStepClick={handleStepClick}
          onResetClick={() => setOpenResetDialog(true)}
          canReset={mainPieces.length > 0 || !!wizardTempMaterial}
          validationError={validationError}
          logo={logo}
        />

        {/* --- B. CONTENIDO --- */}
        <Box
          sx={{
            flexGrow: 1,
            overflowY: "auto",
            p: { xs: 2, sm: 4 },
            backgroundColor: "#fafafa",
          }}
        >
          {activeStep === steps.length ? (
            <Box sx={{ textAlign: "center", mt: 4 }}>
              <Typography variant="h5" gutterBottom>
                ¡Proceso Finalizado!
              </Typography>
              <Button onClick={handleReset} variant="outlined" sx={{ mt: 2 }}>
                Volver al Inicio
              </Button>
            </Box>
          ) : (
            <WizardContent activeStep={activeStep} />
          )}
        </Box>

        {/* --- C. PIE FIJO --- */}
        {activeStep < steps.length && (
          <WizardFooter
            activeStep={activeStep}
            stepsCount={steps.length}
            isMobile={isMobile}
            onNext={handleNext}
            onBack={handleBack}
            showStandardNav={activeStep !== 4}
          />
        )}
      </Paper>

      {/* --- ELEMENTOS DE UI en Overlay --- */}
      {/* 1. Spinner de carga bloquiante */}
      <Backdrop sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }} open={isLoadingDraft}>
        <CircularProgress color="inherit" />
        <Box ml={2}>Recuperando presupuesto...</Box>
      </Backdrop>

      {/* 2. Alerta de precios recalculados */}
      <Snackbar
        open={showPriceWarning}
        autoHideDuration={10000}
        onClose={() => setShowPriceWarning(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="warning" onClose={() => setShowPriceWarning(false)} sx={{ width: "100%" }}>
          <AlertTitle>Precios Actualizados</AlertTitle>
          Tu presupuesto ha caducado. Hemos actualizado los precios a la tarifa vigente.
        </Alert>
      </Snackbar>

      {/* 3. Alerta de Error */}
      <Snackbar open={!!loadError} autoHideDuration={6000} onClose={() => setLoadError(null)}>
        <Alert severity="error">{loadError}</Alert>
      </Snackbar>

      {/* --- 4. MODAL DE CONFIRMACIÓN DE REINICIO --- */}
      <ResetQuoteDialog
        open={openResetDialog}
        onClose={() => setOpenResetDialog(false)}
        onReset={handleReset}
        onUpdate={() => {
          setPendingResetAction("UPDATE");
          setTempDraftName(currentDraftName || "");
          setOpenResetDialog(false);
          setOpenNamingModal(true);
        }}
        onSaveAsCopy={() => {
          setPendingResetAction("SAVE_AS_COPY");
          setTempDraftName(currentDraftName ? `${currentDraftName} (Copia)` : "");
          setOpenResetDialog(false);
          setOpenNamingModal(true);
        }}
        isSaving={isSavingAndResetting}
        currentDraftId={currentDraftId}
        hasContent={mainPieces.length > 0}
      />

      {/* --- 5. MODAL PARA PEDIR NOMBRE ANTES DE REINICIAR --- */}
      <DraftNamingDialog
        open={openNamingModal}
        onClose={() => setOpenNamingModal(false)}
        onConfirm={async (name) => {
          if (pendingResetAction === "SAVE_AS_COPY") {
            await handleSaveAsNewAndReset(name);
          } else {
            await handleUpdateAndReset(name);
          }
          setOpenNamingModal(false);
        }}
        isSaving={isSavingAndResetting}
        initialName={tempDraftName}
        title={pendingResetAction === "SAVE_AS_COPY" ? "Guardar Copia" : "Guardar Presupuesto"}
      />

      {/* --- 6. DIÁLOGO DE CARGA GRUPAL --- */}
      <GroupLoaderDialog
        open={showGroupLoader}
        onClose={() => setShowGroupLoader(false)}
        onConfirm={async () => {
          if (!pendingGroupId) return;
          try {
            await addItemsFromGroup(pendingGroupId);
            setGroupLoadSuccess(true);
          } catch (error) {
            console.error("Group Load Error:", error);
            setGroupLoadError("No se pudieron cargar todos los elementos del grupo.");
          } finally {
            setShowGroupLoader(false);
          }
        }}
      />

      {/* 7. Snackbar de éxito de carga grupal */}
      <Snackbar open={groupLoadSuccess} autoHideDuration={6000} onClose={() => setGroupLoadSuccess(false)}>
        <Alert severity="success" variant="filled">
          Grupo de presupuestos añadido correctamente al carrito.
        </Alert>
      </Snackbar>

      {/* 8. Snackbar de error de carga grupal */}
      <Snackbar open={!!groupLoadError} autoHideDuration={6000} onClose={() => setGroupLoadError(null)}>
        <Alert severity="error" variant="filled">
          {groupLoadError}
        </Alert>
      </Snackbar>
    </Container>
  );
};

const NewQuoteWizardPage: React.FC = () => {
  return (
    <QuoteProvider>
      <WizardStepperContent />
    </QuoteProvider>
  );
};

export default NewQuoteWizardPage;
