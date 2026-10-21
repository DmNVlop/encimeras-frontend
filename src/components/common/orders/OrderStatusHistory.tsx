import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import { Undo as UndoIcon } from "@mui/icons-material";
import type { OrderStatusChange } from "@/interfases/orders.interfase";
import { getOrderStatusMeta } from "@/utils/orderStatus.util";
import { getOrderStatusIcon } from "./OrderStatusChip";

const formatDateTime = (iso: string) => new Date(iso).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

interface OrderStatusHistoryProps {
  history?: OrderStatusChange[];
  orderDate: string | Date;
  /** El portal no enseña quién hizo cada cambio (personal interno de la fábrica). */
  showAuthor?: boolean;
}

/** Historial de estados, más reciente arriba, con la creación del pedido al final. Notas siempre visibles. */
export const OrderStatusHistory: React.FC<OrderStatusHistoryProps> = ({ history = [], orderDate, showAuthor = true }) => {
  const entries = [...history].reverse();

  return (
    <Stack spacing={0}>
      {entries.map((h, i) => {
        const meta = getOrderStatusMeta(h.to);
        return (
          <Box key={`${h.at}-${i}`} sx={{ display: "flex", gap: 1, pb: 1, position: "relative" }}>
            <Box sx={{ color: `${meta.color}.main`, display: "flex", pt: 0.25, "& svg": { fontSize: 18 } }}>{h.undo ? <UndoIcon /> : getOrderStatusIcon(h.to)}</Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="body2" fontWeight={700} lineHeight={1.3}>
                {h.undo ? `Deshecho: vuelve a ${meta.label}` : meta.label}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" lineHeight={1.3}>
                {formatDateTime(h.at)}
                {showAuthor && h.byName ? ` · ${h.byName}` : ""}
              </Typography>
              {h.note && (
                <Typography variant="caption" display="block" sx={{ mt: 0.25, px: 0.75, py: 0.25, bgcolor: "action.hover", borderRadius: 1, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {h.note}
                </Typography>
              )}
            </Box>
          </Box>
        );
      })}
      <Box sx={{ display: "flex", gap: 1 }}>
        <Box sx={{ color: "text.disabled", display: "flex", pt: 0.25, "& svg": { fontSize: 18 } }}>{getOrderStatusIcon("PENDING")}</Box>
        <Box>
          <Typography variant="body2" fontWeight={700} lineHeight={1.3}>
            Pedido recibido
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatDateTime(String(orderDate))}
          </Typography>
        </Box>
      </Box>
    </Stack>
  );
};

export default OrderStatusHistory;
