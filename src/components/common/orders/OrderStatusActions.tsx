import React, { useState } from "react";
import { Button, Stack, Tooltip } from "@mui/material";
import { Undo as UndoIcon } from "@mui/icons-material";
import type { OrderStatus, OrderStatusActions as OrderStatusActionsModel } from "@/interfases/orders.interfase";
import { getOrderStatusActionLabel, getOrderStatusMeta, getPrimaryStatusTarget, isOrderStatusClosedKo } from "@/utils/orderStatus.util";
import { getOrderStatusIcon } from "./OrderStatusChip";
import { OrderStatusNoteDialog } from "./OrderStatusNoteDialog";
import { useOrderStatusChange } from "./useOrderStatusChange";

interface OrderStatusActionsProps {
  orderId: string;
  actions?: OrderStatusActionsModel;
  /** Se llama tras cada intento (éxito o error) para recargar la orden del servidor. */
  onDone: () => void;
  /** En el portal el cliente solo ve «Cancelar pedido»; la barra se adapta sola a lo que mande el BE. */
  direction?: "row" | "column";
}

type PendingNote = { kind: "status"; target: OrderStatus } | { kind: "undo" } | null;

/**
 * Botones de cambio de estado de una orden. Pinta **solo** lo que el BE resolvió para quien mira
 * (`statusActions`): el FE no replica transiciones ni permisos. Rechazar/cancelar/deshacer piden nota.
 */
export const OrderStatusActions: React.FC<OrderStatusActionsProps> = ({ orderId, actions, onDone, direction = "row" }) => {
  const { busy, changeStatus, undoStatus, feedbackElement } = useOrderStatusChange(onDone);
  const [pendingNote, setPendingNote] = useState<PendingNote>(null);

  const targets = actions?.targets ?? [];
  const primary = getPrimaryStatusTarget(targets);
  const needsNote = (t: OrderStatus) => actions?.noteRequired?.includes(t) ?? false;

  const handleTarget = (target: OrderStatus) => {
    if (needsNote(target)) setPendingNote({ kind: "status", target });
    else changeStatus(orderId, target);
  };

  const handleConfirmNote = async (note: string) => {
    if (!pendingNote) return;
    if (pendingNote.kind === "undo") await undoStatus(orderId, note);
    else await changeStatus(orderId, pendingNote.target, note);
    setPendingNote(null);
  };

  if (!targets.length && !actions?.canUndo) return feedbackElement;

  const dialog =
    pendingNote?.kind === "undo"
      ? {
          title: "Deshacer el último cambio",
          description: `El pedido volverá a «${getOrderStatusMeta(actions?.undoTo ?? "").label}». Queda registrado en el historial con tu nota.`,
          confirmLabel: "Deshacer",
          destructive: false,
        }
      : pendingNote?.kind === "status"
        ? {
            title: getOrderStatusActionLabel(pendingNote.target),
            description:
              pendingNote.target === "REJECTED"
                ? "El pedido quedará rechazado. El cliente verá este motivo en su portal."
                : "El pedido quedará cancelado. El cliente verá este motivo en su portal.",
            confirmLabel: getOrderStatusActionLabel(pendingNote.target),
            destructive: true,
          }
        : null;

  return (
    <>
      <Stack direction={direction} spacing={1} useFlexGap flexWrap="wrap" alignItems={direction === "row" ? "center" : "stretch"}>
        {targets.map((target) => {
          const ko = isOrderStatusClosedKo(target);
          const label = getOrderStatusActionLabel(target);
          return (
            <Tooltip key={target} title={`${label}: el pedido pasa a «${getOrderStatusMeta(target).label}»${needsNote(target) ? " (pide motivo)" : ""}`}>
              <span>
                <Button
                  size="small"
                  variant={target === primary ? "contained" : "outlined"}
                  color={ko ? "error" : "primary"}
                  startIcon={getOrderStatusIcon(target)}
                  disabled={busy}
                  onClick={() => handleTarget(target)}
                  fullWidth={direction === "column"}
                  data-testid={`order-action-${target}`}
                >
                  {label}
                </Button>
              </span>
            </Tooltip>
          );
        })}
        {actions?.canUndo && (
          <Tooltip title={`Deshacer el último cambio: vuelve a «${getOrderStatusMeta(actions.undoTo ?? "").label}» (pide motivo)`}>
            <span>
              <Button size="small" variant="text" color="inherit" startIcon={<UndoIcon />} disabled={busy} onClick={() => setPendingNote({ kind: "undo" })} fullWidth={direction === "column"} data-testid="order-action-undo">
                Deshacer
              </Button>
            </span>
          </Tooltip>
        )}
      </Stack>

      <OrderStatusNoteDialog
        open={!!dialog}
        title={dialog?.title ?? ""}
        description={dialog?.description ?? ""}
        confirmLabel={dialog?.confirmLabel ?? ""}
        destructive={dialog?.destructive}
        busy={busy}
        onClose={() => setPendingNote(null)}
        onConfirm={handleConfirmNote}
      />
      {feedbackElement}
    </>
  );
};

export default OrderStatusActions;
