import React, { useState } from "react";
import {
  Container,
  Box,
  Paper,
  Stepper,
  Step,
  Button,
  Typography,
  useTheme,
  useMediaQuery,
  MobileStepper,
  Alert,
  StepButton,
  Backdrop,
  CircularProgress,
  Snackbar,
  AlertTitle,
} from "@mui/material";
import { KeyboardArrowLeft, KeyboardArrowRight, Person } from "@mui/icons-material";
import { QuoteProvider, useQuoteDispatch, useQuoteState } from "@/context/QuoteContext";
import logo from "@/assets/logos/kuuk-logo.png";
import { StepConnector } from "@mui/material";

// Importar los pasos
import { WizardStep1_Materials } from "./steps/WizardStep1_Materials";
import { WizardStep2_ShapeAndMeasures } from "./steps/WizardStep2_ShapeAndMeasures";
import { WizardStep3_JobsAndAssembly } from "./steps/WizardStep3_JobsAndAssembly";
import { WizardStep4_Complements } from "./steps/WizardStep4_Complements";
import { WizardStep5_Summary } from "./steps/WizardStep5_Summary";
import { useLocation, useNavigate } from "react-router-dom";
import { draftsApi } from "@/services/drafts.service";
import { validateAssemblies } from "@/utils/quoteValidation";

const steps = ["Material", "Forma y Medidas", "Trabajos y Ensamblaje", "Complementos", "Resumen"];

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
  const { wizardTempMaterial, mainPieces } = useQuoteState();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showPriceWarning, setShowPriceWarning] = useState(false);

  // --- HOOKS ---
  const dispatch = useQuoteDispatch(); // <--- Necesitas exponer esto en tu Context
  const location = useLocation(); // Para leer ?draftId=...
  const navigate = useNavigate();

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
        {/* --- A. CABECERA FIJA --- */}
        <Box
          sx={{
            flexShrink: 0,
            backgroundColor: "#fff",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          {/* Main Header Row */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              p: { xs: 1, sm: 2 },
              gap: 2,
            }}
          >
            {/* 1. IZQUIERDA: Logo + Título */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
              <Box
                component="img"
                src={logo}
                alt="Kuuk Logo"
                onClick={() => navigate("/dashboard")}
                sx={{
                  maxHeight: { xs: 32, sm: 40 },
                  width: "auto",
                  objectFit: "contain",
                  display: "block",
                  cursor: "pointer",
                }}
              />
              <Typography
                variant={isMobile ? "subtitle1" : "h6"}
                component="h1"
                onClick={() => navigate("/dashboard")}
                sx={{
                  fontWeight: "bold",
                  lineHeight: 1.2,
                  display: { xs: "none", md: "block" },
                  cursor: "pointer",
                }}
              >
                Configurador de Encimeras
              </Typography>
              <Typography
                variant="subtitle1"
                component="h1"
                onClick={() => navigate("/dashboard")}
                sx={{
                  fontWeight: "bold",
                  lineHeight: 1.2,
                  display: { xs: "block", md: "none" },
                  cursor: "pointer",
                }}
              >
                Configurador
              </Typography>
            </Box>

            {/* 2. CENTRO: Stepper (Solo Desktop) */}
            {!isMobile && (
              <Box sx={{ flexGrow: 1, maxWidth: "800px", mx: 2 }}>
                <Stepper
                  activeStep={activeStep}
                  alternativeLabel
                  nonLinear
                  connector={<StepConnector />}
                  sx={{
                    "& .MuiStepLabel-label": { mt: 0.5, fontSize: "0.75rem" },
                    p: 0,
                  }}
                >
                  {steps.map((label, index) => (
                    <Step key={label} completed={activeStep > index}>
                      <StepButton color="inherit" onClick={() => handleStepClick(index)}>
                        {label}
                      </StepButton>
                    </Step>
                  ))}
                </Stepper>
              </Box>
            )}

            {/* 3. DERECHA: Botón Portal Usuario */}
            <Box sx={{ flexShrink: 0 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Person />}
                onClick={() => navigate("/my-quotes")}
                sx={{
                  borderRadius: 50,
                  textTransform: "none",
                  whiteSpace: "nowrap",
                  minWidth: "auto",
                }}
              >
                {isMobile ? "Portal" : "Portal del Usuario"}
              </Button>
            </Box>
          </Box>

          {/* Error Alert */}
          {validationError && (
            <Alert severity="error" sx={{ m: 0, borderRadius: 0 }}>
              {validationError}
            </Alert>
          )}
        </Box>

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
          <Box
            sx={{
              p: 2,
              flexShrink: 0,
              borderTop: "1px solid",
              borderColor: "divider",
              backgroundColor: "#fff",
              zIndex: 1,
            }}
          >
            {activeStep !== 4 ? (
              // NAVEGACIÓN ESTÁNDAR
              isMobile ? (
                <MobileStepper
                  variant="progress"
                  steps={steps.length}
                  position="static"
                  activeStep={activeStep}
                  nextButton={
                    <Button size="small" onClick={handleNext} variant="contained">
                      Siguiente <KeyboardArrowRight />
                    </Button>
                  }
                  backButton={
                    <Button size="small" onClick={handleBack} disabled={activeStep === 0}>
                      <KeyboardArrowLeft /> Atrás
                    </Button>
                  }
                />
              ) : (
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Button onClick={handleBack} disabled={activeStep === 0} variant="outlined" color="inherit">
                    Atrás
                  </Button>
                  <Button onClick={handleNext} variant="contained" size="large">
                    {activeStep === steps.length - 1 ? "Finalizar" : "Siguiente Paso"}
                  </Button>
                </Box>
              )
            ) : (
              // PASO 5: RESUMEN
              <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
                <Button onClick={handleBack} color="inherit">
                  <KeyboardArrowLeft /> Volver a editar
                </Button>
              </Box>
            )}
          </Box>
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
