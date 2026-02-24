import React from "react";
import { Box, Typography, Stepper, Step, StepButton, Tooltip, IconButton, Button, Alert, StepConnector } from "@mui/material";
import { Add, Person } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

interface WizardHeaderProps {
  activeStep: number;
  steps: string[];
  isMobile: boolean;
  onStepClick: (index: number) => void;
  onResetClick: () => void;
  canReset: boolean;
  validationError: string | null;
  logo: string;
}

export const WizardHeader: React.FC<WizardHeaderProps> = ({ activeStep, steps, isMobile, onStepClick, onResetClick, canReset, validationError, logo }) => {
  const navigate = useNavigate();

  return (
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
            Presupuestador de Encimeras
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
            Presupuestador
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
                  <StepButton color="inherit" onClick={() => onStepClick(index)}>
                    {label}
                  </StepButton>
                </Step>
              ))}
            </Stepper>
          </Box>
        )}

        {/* 3. DERECHA: Botones de Acción */}
        <Box sx={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip title="Nuevo Presupuesto">
            <IconButton
              color="primary"
              onClick={onResetClick}
              disabled={!canReset}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "rgba(25, 118, 210, 0.04)",
                "&:hover": {
                  bgcolor: "rgba(25, 118, 210, 0.08)",
                },
              }}
            >
              <Add />
            </IconButton>
          </Tooltip>

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
  );
};
