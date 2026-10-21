import React from "react";
import { Alert, Box, Step, StepLabel, Stepper, Typography, useMediaQuery, useTheme } from "@mui/material";
import type { OrderStatus, OrderStatusChange } from "@/interfases/orders.interfase";
import { getOrderProgressStep, getOrderStatusMeta, isOrderStatusClosedKo, ORDER_PROGRESS_STEPS } from "@/utils/orderStatus.util";

interface OrderProgressProps {
  status: OrderStatus;
  history?: OrderStatusChange[];
}

/**
 * Seguimiento del pedido por el camino feliz. Si está rechazado o cancelado no hay pasos que mostrar:
 * se enseña el motivo (nota del último cambio), que el cliente también ve en su portal.
 * En móvil, solo los iconos de los pasos y el paso actual en texto (la versión vertical ocupaba media pantalla).
 */
export const OrderProgress: React.FC<OrderProgressProps> = ({ status, history = [] }) => {
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down("sm"));

  if (isOrderStatusClosedKo(status)) {
    const last = [...history].reverse().find((h) => h.to === status);
    return (
      <Alert severity="error" variant="outlined" sx={{ py: 0.5 }}>
        <strong>{getOrderStatusMeta(status).label}.</strong> {last?.note ? `Motivo: ${last.note}` : "Sin motivo registrado."}
      </Alert>
    );
  }

  const active = getOrderProgressStep(status);
  const done = active >= ORDER_PROGRESS_STEPS.length;

  return (
    <Box>
      <Stepper activeStep={active} alternativeLabel={!compact} sx={{ "& .MuiStepLabel-label": { fontSize: "0.75rem", mt: "4px !important" } }}>
        {ORDER_PROGRESS_STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{compact ? "" : label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      {compact && (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
          {done ? "Pedido entregado" : `Paso ${active + 1} de ${ORDER_PROGRESS_STEPS.length}: ${ORDER_PROGRESS_STEPS[active]}`}
        </Typography>
      )}
    </Box>
  );
};

export default OrderProgress;
