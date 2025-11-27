import React, { useState } from "react";
import { Container, Box, Paper, Stepper, Step, Button, Typography, useTheme, useMediaQuery, MobileStepper, Alert, StepButton } from "@mui/material";
import { KeyboardArrowLeft, KeyboardArrowRight } from "@mui/icons-material";
import { QuoteProvider, useQuoteState } from "../../../context/QuoteContext";

// Importar los pasos
import { WizardStep1_Materials } from "./steps/WizardStep1_Materials";
import { WizardStep2_ShapeAndMeasures } from "./steps/WizardStep2_ShapeAndMeasures";
import { WizardStep3_JobsAndAssembly } from "./steps/WizardStep3_JobsAndAssembly";
import { WizardStep4_Complements } from "./steps/WizardStep4_Complements";
import { WizardStep5_Summary } from "./steps/WizardStep5_Summary";

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
        <Box
          sx={{
            p: { xs: 2, sm: 3 },
            flexShrink: 0,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography component="h1" variant="h5" align="center" gutterBottom sx={{ fontWeight: "bold" }}>
            Configurador de Encimeras
          </Typography>

          {!isMobile && (
            <Stepper activeStep={activeStep} alternativeLabel nonLinear>
              {steps.map((label, index) => (
                <Step key={label} completed={activeStep > index}>
                  <StepButton color="inherit" onClick={() => handleStepClick(index)}>
                    {label}
                  </StepButton>
                </Step>
              ))}
            </Stepper>
          )}

          {validationError && (
            <Alert severity="error" sx={{ mt: 2 }}>
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
