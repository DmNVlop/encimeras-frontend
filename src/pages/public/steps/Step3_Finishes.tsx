import React, { useState, useEffect } from "react";
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, List, ListItem, ListItemText, IconButton, TextField, type SelectChangeEvent, Button } from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import { useQuoteState, useQuoteDispatch } from "../../../context/QuoteContext";
import { get } from "../../../services/apiService";

// Interfaces para los datos de la API
interface EdgeProfile {
  _id: string;
  name: string;
}

interface Cutout {
  _id: string;
  name: string;
  price: number;
}

// 1. Definimos las props que el componente recibirá del Wizard
interface StepProps {
  onNext: () => void;
  onBack: () => void;
}

const Step3_EdgeAndCutouts: React.FC<StepProps> = ({ onNext, onBack }) => {
  const { edgeProfileId, cutouts: selectedCutouts } = useQuoteState();
  const dispatch = useQuoteDispatch();

  const [edgeProfiles, setEdgeProfiles] = useState<EdgeProfile[]>([]);
  const [cutouts, setCutouts] = useState<Cutout[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [edgeData, cutoutData] = await Promise.all([get<EdgeProfile>("/edge-profiles"), get<Cutout>("/cutouts")]);
      setEdgeProfiles(edgeData);
      setCutouts(cutoutData);
    };
    fetchData();
  }, []);

  const handleEdgeChange = (event: SelectChangeEvent<string>) => {
    const selectedId = event.target.value;
    const selectedEdge = edgeProfiles.find((e) => e._id === selectedId);
    if (selectedEdge) {
      dispatch({
        type: "SET_EDGE_PROFILE",
        payload: { edgeProfileId: selectedId, edgeProfileName: selectedEdge.name },
      });
    }
  };

  const handleQuantityChange = (cutout: Cutout, quantity: number) => {
    const newQuantity = Math.max(0, quantity);
    const existingCutout = selectedCutouts.find((c) => c.cutoutId === cutout._id);

    let newSelectedCutouts;

    if (newQuantity === 0) {
      newSelectedCutouts = selectedCutouts.filter((c) => c.cutoutId !== cutout._id);
    } else if (existingCutout) {
      newSelectedCutouts = selectedCutouts.map((c) => (c.cutoutId === cutout._id ? { ...c, quantity: newQuantity } : c));
    } else {
      newSelectedCutouts = [...selectedCutouts, { cutoutId: cutout._id, name: cutout.name, price: cutout.price, quantity: newQuantity }];
    }

    dispatch({ type: "SET_CUTOUTS", payload: newSelectedCutouts });
  };

  // 2. Lógica para validar si el paso está completo
  const isStepComplete = (): boolean => {
    // El único campo obligatorio en este paso es el tipo de canto
    return !!edgeProfileId;
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        {" "}
        Paso 3: Cantos y Acabados{" "}
      </Typography>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel id="edge-profile-label"> Tipo de Canto * </InputLabel>
        <Select labelId="edge-profile-label" value={edgeProfileId || ""} label="Tipo de Canto *" onChange={handleEdgeChange} required>
          {edgeProfiles.map((edge) => (
            <MenuItem key={edge._id} value={edge._id}>
              {edge.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Typography sx={{ mb: 1 }}> Cortes y Acabados(Opcional) </Typography>
      <List sx={{ border: "1px solid #ccc", borderRadius: 1 }}>
        {cutouts.map((cutout) => {
          const selected = selectedCutouts.find((c) => c.cutoutId === cutout._id);
          const quantity = selected ? selected.quantity : 0;

          return (
            <ListItem
              key={cutout._id}
              divider
              onClick={() => {
                handleQuantityChange(cutout, quantity + 1);
              }}>
              <ListItemText primary={cutout.name} />
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuantityChange(cutout, quantity - 1);
                  }}>
                  <RemoveCircleOutlineIcon />
                </IconButton>
                <TextField
                  value={quantity}
                  onChange={(e) => handleQuantityChange(cutout, parseInt(e.target.value, 10) || 0)}
                  type="number"
                  inputProps={{ style: { textAlign: "center" }, min: 0 }}
                  sx={{ width: "60px", mx: 1 }}
                />
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuantityChange(cutout, quantity + 1);
                  }}>
                  <AddCircleOutlineIcon />
                </IconButton>
              </Box>
            </ListItem>
          );
        })}
      </List>

      {/* 3. Añadimos los botones de navegación */}
      <Box sx={{ mt: 4, display: "flex", justifyContent: "space-between" }}>
        <Button onClick={onBack}>Atrás</Button>
        <Button variant="contained" onClick={onNext} disabled={!isStepComplete()}>
          Siguiente
        </Button>
      </Box>
    </Box>
  );
};

export default Step3_EdgeAndCutouts;
