import React from "react";
import { Paper, Typography, Button } from "@mui/material";

interface SuccessViewProps {
  onStartNew: () => void;
}

export const SuccessView: React.FC<SuccessViewProps> = ({ onStartNew }) => {
  return (
    <Paper elevation={3} sx={{ p: 5, textAlign: "center", mt: 4 }}>
      <Typography variant="h4" color="success.main" gutterBottom>
        ¡Gracias!
      </Typography>
      <Typography>Tu solicitud de presupuesto ha sido enviada correctamente.</Typography>
      <Button variant="outlined" sx={{ mt: 3 }} onClick={onStartNew}>
        Iniciar nuevo presupuesto
      </Button>
    </Paper>
  );
};
