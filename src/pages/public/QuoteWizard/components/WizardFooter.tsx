import React from "react";
import { Box, Button, MobileStepper } from "@mui/material";
import { KeyboardArrowLeft, KeyboardArrowRight } from "@mui/icons-material";

interface WizardFooterProps {
  activeStep: number;
  stepsCount: number;
  isMobile: boolean;
  onNext: () => void;
  onBack: () => void;
  showStandardNav: boolean;
}

export const WizardFooter: React.FC<WizardFooterProps> = ({ activeStep, stepsCount, isMobile, onNext, onBack, showStandardNav }) => {
  return (
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
      {showStandardNav ? (
        // NAVEGACIÓN ESTÁNDAR
        isMobile ? (
          <MobileStepper
            variant="progress"
            steps={stepsCount}
            position="static"
            activeStep={activeStep}
            nextButton={
              <Button size="small" onClick={onNext} variant="contained">
                Siguiente <KeyboardArrowRight />
              </Button>
            }
            backButton={
              <Button size="small" onClick={onBack} disabled={activeStep === 0}>
                <KeyboardArrowLeft /> Atrás
              </Button>
            }
          />
        ) : (
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Button onClick={onBack} disabled={activeStep === 0} variant="outlined" color="inherit">
              Atrás
            </Button>
            <Button onClick={onNext} variant="contained" size="large">
              {activeStep === stepsCount - 1 ? "Finalizar" : "Siguiente Paso"}
            </Button>
          </Box>
        )
      ) : (
        // NAVEGACIÓN ESPECIAL (Ej. Final o Resumen custom)
        <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
          <Button onClick={onBack} color="inherit">
            <KeyboardArrowLeft /> Volver a editar
          </Button>
        </Box>
      )}
    </Box>
  );
};
