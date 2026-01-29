import React from "react";
import { Drawer, Box, Typography, IconButton, List, ListItem, ListItemText, Chip, Button, Grid, Paper, Avatar, ListItemAvatar } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DoNotDisturbOnIcon from "@mui/icons-material/DoNotDisturbOn";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";

// Helper para traducir claves técnicas a etiquetas legibles (Opcional)
const ATTRIBUTE_LABELS: Record<string, string> = {};

export const OrderPreviewDrawer: React.FC<any> = ({ open, onClose, order, onApprove, onReject }) => {
  if (!order) return null;

  // Extraemos datos de forma segura (asumiendo que quizás solo tienes el header al principio)
  const header = order.header || order;
  // Intentamos localizar el snapshot técnico.
  // Si la API devuelve el snapshot directo en la raíz (como tu JSON), úsalo directamente.
  // Si está anidado en items[0], úsalo desde ahí.
  const technicalData = order.items?.[0]?.technicalSnapshot || order.technicalSnapshot || order;

  console.log("Technical Data:", technicalData);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        // 1. Forzamos que esté por encima de TODO (el AppBar suele ser 1100, el Modal 1300)
        zIndex: (theme) => theme.zIndex.modal + 10,

        // 2. Aseguramos que el papel (el panel blanco) tenga el ancho correcto y ocupe toda la altura
        "& .MuiDrawer-paper": {
          width: { xs: "100%", md: "720px" },
          boxSizing: "border-box",
          marginTop: 0, // Asegura que no deje espacio arriba si hay estilos globales
          height: "100vh", // Fuerza la altura completa
        },
      }}
    >
      {/* --- CABECERA DEL DRAWER --- */}
      <Box sx={{ p: 2, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            Orden ID: <span style={{ fontSize: "1.2em", fontWeight: "700", color: "#373737" }}> {header.orderNumber}</span>
          </Typography>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Typography variant="h6" fontWeight="bold">
              {header.status}
            </Typography>
            {/* Aquí podrías poner el Chip de color según estado */}
          </Box>
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* --- CONTENIDO SCROLLEABLE --- */}
      <Box sx={{ p: 3, overflowY: "auto", flexGrow: 1 }}>
        {/* 1. Datos Cliente */}
        <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: "#fafafa" }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Cliente
          </Typography>
          <Typography variant="body1">{header.customerId}</Typography>
          <Typography variant="caption" color="text.secondary">
            Fecha: {new Date(header.orderDate).toLocaleString()}
          </Typography>
        </Paper>

        {/* 2. Resumen Técnico (Aquí iría el loop de piezas si tienes el snapshot) */}
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2, mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
          <PrecisionManufacturingIcon fontSize="small" /> Producción
        </Typography>

        {/* Ejemplo de visualización si tuviéramos las piezas cargadas */}
        {technicalData && technicalData.pieces ? (
          <List disablePadding>
            {technicalData.pieces.map((piece: any, idx: number) => {
              // A. LOOKUP: Buscar el material correspondiente por ID
              const material = technicalData.materials.find((m: any) => m.materialId === piece.materialId);

              // B. DATOS PRINCIPALES
              const materialName = material?.materialName || "Material Desconocido";
              const finish = piece.selectedAttributes.MAT_FINISH || "";
              const imageUrl = material?.materialImage;

              // C. ATRIBUTOS SECUNDARIOS (Filtrar los que queremos mostrar)
              const relevantAttrs = ["MAT_THICKNESS", "MAT_GROUP", "MAT_FACE", "MAT_TEXTURE"];

              return (
                <Paper key={idx} variant="outlined" sx={{ mb: 2, overflow: "hidden" }}>
                  <ListItem alignItems="flex-start" sx={{ px: 2, py: 2 }}>
                    {/* 1. IMAGEN DEL MATERIAL */}
                    <ListItemAvatar sx={{ mt: 0, mr: 2 }}>
                      <Avatar variant="rounded" src={imageUrl} sx={{ width: 64, height: 64, border: "1px solid #ddd" }} />
                    </ListItemAvatar>

                    <ListItemText
                      // 2. TÍTULO: MATERIAL + ACABADO (Lo que pediste)
                      primary={
                        <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
                          Pieza {idx + 1}: {materialName} {finish ? `- ${finish}` : ""}
                        </Typography>
                      }
                      // Usamos slotProps en lugar de secondaryTypographyProps
                      slotProps={{
                        secondary: { component: "div" },
                      }}
                      secondary={
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.4, mt: 0 }}>
                          {/* 3. MEDIDAS (Destacadas) */}
                          <Typography variant="body2" fontWeight="bold" color="text.primary">
                            {piece.measurements.length_mm}mm x {piece.measurements.width_mm}mm
                          </Typography>

                          {/* ATRIBUTOS TÉCNICOS (Chips o Texto) */}
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                            {relevantAttrs.map((attrKey) => {
                              const val = piece.selectedAttributes[attrKey];
                              if (!val) return null;
                              return (
                                <Chip
                                  key={attrKey}
                                  label={`${ATTRIBUTE_LABELS[attrKey] || attrKey}: ${val}`}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: "0.7rem", height: 24, bgcolor: "#f5f5f5" }}
                                />
                              );
                            })}
                          </Box>

                          {/* 5. ACCESORIOS (Si los hay) */}
                          {piece.appliedAddons && piece.appliedAddons.length > 0 && (
                            <Typography variant="caption" color="secondary" sx={{ mt: 0.5 }}>
                              + Incluye {piece.appliedAddons.length} mecanizados/accesorios
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                </Paper>
              );
            })}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
            Cargando detalles técnicos...
          </Typography>
        )}
      </Box>

      {/* --- PIE CON ACCIONES (FOOTER FIJO) --- */}
      <Box sx={{ p: 2, borderTop: "1px solid #eee", bgcolor: "#fff" }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            {/* <Button fullWidth variant="outlined" startIcon={<ViewInArIcon />} onClick={() => onOpenDetail(order._id || order.id)}>
              Abrir Inspector 3D Completo
            </Button> */}
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Button fullWidth variant="outlined" color="error" startIcon={<DoNotDisturbOnIcon />} onClick={() => onReject(order._id || order.id)}>
              Rechazar
            </Button>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Button fullWidth variant="contained" color="success" startIcon={<CheckCircleIcon />} onClick={() => onApprove(order._id || order.id)}>
              Aprobar para Fábrica
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Drawer>
  );
};
