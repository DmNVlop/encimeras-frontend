// src/pages/public/QuoteWizardPage.tsx
import React, { useState } from "react";
import { Container, Box, Stepper, Step, StepLabel, Typography, Paper, Button } from "@mui/material";
import Step1_Material from "./steps/Step1_Material";
import Step2_ShapeAndMeasurements from "./steps/Step2_Measurements";
import Step3_EdgeAndCutouts from "./steps/Step3_Finishes";
import Step4_SummaryAndContact from "./steps/Step4_Summary";
import { Link as RouterLink } from "react-router-dom";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

const steps = ["Seleccionar Material", "Medidas y Forma", "Cantos y Acabados", "Resumen"];

const QuoteWizardPage: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return <Step1_Material onNext={handleNext} />;
      case 1:
        return <Step2_ShapeAndMeasurements onNext={handleNext} onBack={handleBack} />;
      case 2:
        return <Step3_EdgeAndCutouts onNext={handleNext} onBack={handleBack} />;
      case 3:
        return <Step4_SummaryAndContact onBack={handleBack} onNext={handleNext} />;
      default:
        return "Paso desconocido";
    }
  };

  return (
    <Container component="main" maxWidth="md" sx={{ mt: 4, mb: 4 }} style={{ width: "90vw", maxWidth: 1920 }}>
      <Box sx={{ position: "absolute", top: 16, right: 16 }}>
        <Button component={RouterLink} to="/admin/login" variant="outlined" startIcon={<AdminPanelSettingsIcon />}>
          Panel Admin
        </Button>
      </Box>
      <Typography variant="h3" align="center" gutterBottom>
        Calcula tu Presupuesto
      </Typography>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === steps.length ? (
          <Box sx={{ textAlign: "center", py: 3 }}>
            <Typography variant="h5" gutterBottom>
              ¡Gracias por tu solicitud!
            </Typography>
            <Typography>Hemos recibido tu presupuesto. Nos pondremos en contacto contigo pronto.</Typography>
            <Button onClick={() => setActiveStep(0)} sx={{ mt: 2 }}>
              Crear otro presupuesto
            </Button>
          </Box>
        ) : (
          <Box>{getStepContent(activeStep)}</Box>
        )}
      </Paper>
    </Container>
  );
};

export default QuoteWizardPage;
