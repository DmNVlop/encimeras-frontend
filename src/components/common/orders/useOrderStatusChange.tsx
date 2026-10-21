import { useCallback, useState } from "react";
import { Alert, Snackbar } from "@mui/material";
import { ordersApi } from "@/services/orders.service";
import type { OrderStatus } from "@/interfases/orders.interfase";
import { getOrderStatusMeta } from "@/utils/orderStatus.util";

type Feedback = { severity: "success" | "error"; message: string } | null;

/** Mensaje para el usuario según el error del BE (`PATCH /orders/:id/status` y `undo`). */
const errorMessage = (err: any) => {
  const code = err?.statusCode ?? err?.originalError?.response?.status;
  if (code === 409) return "El pedido ha cambiado mientras tanto. Se han recargado sus datos: revísalo y vuelve a intentarlo.";
  if (code === 403) return "No tienes permiso para este cambio de estado.";
  if (code === 404) return "El pedido no existe o ya no está a tu alcance.";
  const msg = Array.isArray(err?.message) ? err.message.join(" ") : err?.message;
  return msg || "No se pudo cambiar el estado del pedido.";
};

/**
 * Cambio de estado de una orden con su notificación de resultado. Comparte la lógica entre la bandeja,
 * la ficha del backoffice y el portal: tras éxito **o** error se llama a `onDone` para recargar del servidor
 * (la respuesta del PATCH no trae `statusActions`, y un 409 significa que lo que se ve está desfasado).
 */
export function useOrderStatusChange(onDone: () => void) {
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const run = useCallback(
    async (action: () => Promise<unknown>, okMessage: string) => {
      setBusy(true);
      try {
        await action();
        setFeedback({ severity: "success", message: okMessage });
        return true;
      } catch (err) {
        setFeedback({ severity: "error", message: errorMessage(err) });
        return false;
      } finally {
        setBusy(false);
        onDone();
      }
    },
    [onDone],
  );

  const changeStatus = useCallback(
    (orderId: string, status: OrderStatus, note?: string) =>
      run(() => ordersApi.changeStatus(orderId, status, note), `Pedido pasado a «${getOrderStatusMeta(status).label}».`),
    [run],
  );

  const undoStatus = useCallback(
    (orderId: string, note: string) => run(() => ordersApi.undoStatus(orderId, note), "Último cambio de estado deshecho."),
    [run],
  );

  const feedbackElement = feedback ? (
    <Snackbar open autoHideDuration={feedback.severity === "error" ? 8000 : 4000} onClose={() => setFeedback(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
      <Alert severity={feedback.severity} variant="filled" onClose={() => setFeedback(null)} sx={{ width: "100%" }}>
        {feedback.message}
      </Alert>
    </Snackbar>
  ) : null;

  return { busy, changeStatus, undoStatus, feedbackElement };
}
