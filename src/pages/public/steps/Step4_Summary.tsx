// src/pages/public/steps/Step4_SummaryAndContact.tsx
import React, { useState, useEffect } from "react";
import { Box, Typography, Button, TextField, List, ListItem, ListItemText, Divider, CircularProgress, Alert, Grid } from "@mui/material";
import { useQuoteState, useQuoteDispatch } from "../../../context/QuoteContext";
import { create } from "../../../services/apiService";

// Interfaces
interface PriceBreakdown {
  materialCost: number;
  edgeCost: number;
  cutoutCost: number;
  backsplashCost: number;
}

interface PriceResult {
  totalPrice: number;
  priceBreakdown: PriceBreakdown;
}

interface StepProps {
  onBack: () => void;
  onNext: () => void; // onNext nos llevará a la pantalla de "Gracias"
}

const Step4_SummaryAndContact: React.FC<StepProps> = ({ onBack, onNext }) => {
  const state = useQuoteState();
  const dispatch = useQuoteDispatch();
  const { contactDetails } = state;

  const [priceResult, setPriceResult] = useState<PriceResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Calcula el precio al cargar el componente
  useEffect(() => {
    const calculatePrice = async () => {
      // Validamos que tenemos los datos mínimos para calcular
      if (!state.materialId || !state.shape || !state.measurements.fondo || !state.measurements.ladoA) {
        setError("Faltan datos de pasos anteriores para calcular el precio. Por favor, retrocede y completa la información.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const dto = {
          materialId: state.materialId,
          group: state.group,
          face: state.face,
          thickness: state.thickness,
          finish: state.finish,
          shape: state.shape,
          measurements: state.measurements,
          edgeProfileId: state.edgeProfileId,
          cutouts: state.cutouts.map((c) => ({ cutoutId: c.cutoutId, quantity: c.quantity })),
        };
        const result = await create<PriceResult>("/quotes/calculate", dto);
        setPriceResult(result);
      } catch (e) {
        setError((e as string) || "Ocurrió un error al calcular el precio.");
      } finally {
        setLoading(false);
      }
    };
    calculatePrice();
  }, []); // El array vacío asegura que se ejecute solo una vez al montar

  const handleContactChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: "SET_CONTACT_DETAILS",
      payload: { [event.target.name]: event.target.value },
    });
  };

  const handleSubmit = async () => {
    if (!priceResult) return;

    try {
      const finalQuoteDto = { ...state, ...priceResult };
      await create("/quotes", finalQuoteDto);
      dispatch({ type: "RESET" }); // Limpiamos el estado para un nuevo presupuesto
      onNext(); // Avanzamos a la pantalla de agradecimiento
    } catch (e) {
      setError((e as string) || "No se pudo enviar el presupuesto. Inténtalo de nuevo.");
    }
  };

  // 2. Lógica para validar el formulario de contacto
  const isFormComplete = (): boolean => {
    return !!(contactDetails.name && contactDetails.email && /^\S+@\S+\.\S+$/.test(contactDetails.email));
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Paso 4: Resumen y Contacto
      </Typography>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      )}

      {priceResult && !loading && (
        <Grid container spacing={4}>
          {/* Columna del Resumen */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Resumen del Presupuesto
            </Typography>
            <List disablePadding>
              <ListItem>
                <ListItemText primary="Material" secondary={state.materialName || "No seleccionado"} />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText primary="Grosor" secondary={`${state.thickness || "N/A"} cm`} />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText primary="Acabado" secondary={state.finish || "N/A"} />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText primary="Forma" secondary={state.shape || "N/A"} />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText primary="Canto" secondary={state.edgeProfileName || "No seleccionado"} />
              </ListItem>
              <Divider />
              {state.cutouts.length > 0 && (
                <ListItem>
                  <ListItemText primary="Cortes y Acabados" secondary={state.cutouts.map((c) => `${c.name} (x${c.quantity})`).join(", ")} />
                </ListItem>
              )}
            </List>
            <Typography variant="h4" align="right" sx={{ mt: 2 }}>
              Total: {priceResult.totalPrice.toFixed(2)} €
            </Typography>
          </Grid>

          {/* Columna del Formulario de Contacto */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Tus Datos de Contacto
            </Typography>
            <TextField name="name" label="Nombre Completo" fullWidth required margin="normal" value={contactDetails.name || ""} onChange={handleContactChange} />
            <TextField
              name="email"
              label="Correo Electrónico"
              type="email"
              fullWidth
              required
              margin="normal"
              value={contactDetails.email || ""}
              onChange={handleContactChange}
              error={!!(contactDetails.email && !/^\S+@\S+\.\S+$/.test(contactDetails.email))}
              helperText={!!(contactDetails.email && !/^\S+@\S+\.\S+$/.test(contactDetails.email)) ? "Correo electrónico inválido" : ""}
            />
            <TextField name="phone" label="Teléfono (Opcional)" fullWidth margin="normal" value={contactDetails.phone || ""} onChange={handleContactChange} />
          </Grid>
        </Grid>
      )}

      {/* 3. Botones de Navegación */}
      <Box sx={{ mt: 4, display: "flex", justifyContent: "space-between" }}>
        <Button onClick={onBack} disabled={loading}>
          Atrás
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!priceResult || !isFormComplete() || loading}>
          Finalizar y Enviar Presupuesto
        </Button>
      </Box>
    </Box>
  );
};

export default Step4_SummaryAndContact;
