import {
  Box,
  Typography,
  Divider,
  Chip,
  Stack,
  Collapse,
  IconButton,
  Alert,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Straighten as StraightenIcon,
  Build as BuildIcon,
  Percent as PercentIcon,
} from "@mui/icons-material";
import { useState } from "react";
import type { PieceBreakdownItem } from "@/interfases/orders.interfase";

interface PriceBreakdownPanelProps {
  piecesBreakdown: PieceBreakdownItem[];
  itemName?: string;
  /** Puntos totales brutos del ítem (sin descuento) */
  originalPoints: number;
  /** Puntos finales del ítem (con descuento) */
  subtotalPoints: number;
  discountAmount?: number;
}

const fmt = (n: number) =>
  n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function AddonRow({ addon }: { addon: PieceBreakdownItem["addons"][number] }) {
  const measStr = addon.measurements
    ? Object.entries(addon.measurements)
        .filter(([k, v]) => k !== "quantity" && v !== undefined && v !== 0)
        .map(([k, v]) => `${k.replace("_mm", "mm").replace("_ml", "ml")}: ${v}`)
        .join(", ")
    : "";
  const qty = addon.quantity && addon.quantity > 1 ? ` ×${addon.quantity}` : "";

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        pl: 2,
        py: 0.5,
        borderLeft: "2px solid",
        borderColor: "grey.200",
        ml: 1,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flex: 1 }}>
        <BuildIcon sx={{ fontSize: 12, color: "text.disabled", flexShrink: 0 }} />
        <Typography variant="caption" color="text.secondary">
          {addon.name || addon.addonName || addon.code}
          {qty}
          {measStr ? (
            <Typography component="span" variant="caption" color="text.disabled" sx={{ ml: 0.5 }}>
              ({measStr})
            </Typography>
          ) : null}
        </Typography>
      </Box>
      <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ ml: 1, flexShrink: 0 }}>
        {fmt(addon.pricePoints)}
      </Typography>
    </Box>
  );
}

function PieceBlock({ piece, index }: { piece: PieceBreakdownItem; index: number }) {
  const [open, setOpen] = useState(true);
  const hasAddons = piece.addons && piece.addons.length > 0;
  const hasDiscount = piece.discountAmount > 0;

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "grey.200",
        borderRadius: 2,
        overflow: "hidden",
        mb: 1,
      }}
    >
      {/* Cabecera de pieza */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          px: 1.5,
          py: 1,
          bgcolor: "grey.50",
          cursor: hasAddons ? "pointer" : "default",
          userSelect: "none",
        }}
        onClick={() => hasAddons && setOpen((v) => !v)}
      >
        {/* Badge número */}
        <Box
          sx={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            bgcolor: "primary.main",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 700,
            flexShrink: 0,
            mr: 1,
          }}
        >
          {index + 1}
        </Box>

        {/* Material + dimensiones */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={700} noWrap>
            {piece.materialName}
          </Typography>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <StraightenIcon sx={{ fontSize: 11, color: "text.disabled" }} />
            <Typography variant="caption" color="text.secondary">
              {piece.length_mm} × {piece.width_mm} mm
            </Typography>
          </Stack>
        </Box>

        {/* Precio base */}
        <Box sx={{ textAlign: "right", ml: 1 }}>
          <Typography variant="caption" color="text.disabled" display="block">
            base
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            {fmt(piece.basePricePoints)}
          </Typography>
        </Box>

        {hasAddons && (
          <IconButton size="small" sx={{ ml: 0.5, p: 0.25 }}>
            <ExpandMoreIcon
              fontSize="small"
              sx={{
                transform: open ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
                color: "text.secondary",
              }}
            />
          </IconButton>
        )}
      </Box>

      {/* Addons */}
      {hasAddons && (
        <Collapse in={open}>
          <Box sx={{ px: 1.5, pt: 0.5, pb: 1 }}>
            {piece.addons.map((addon, i) => (
              <AddonRow key={`${addon.code}-${i}`} addon={addon} />
            ))}
          </Box>
        </Collapse>
      )}

      {/* Subtotal pieza */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 1.5,
          py: 0.75,
          bgcolor: hasDiscount ? "success.50" : "primary.50",
          borderTop: "1px solid",
          borderColor: "grey.100",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {hasDiscount && (
            <Chip
              icon={<PercentIcon sx={{ fontSize: "12px !important" }} />}
              label={`-${fmt(piece.discountAmount)}`}
              size="small"
              color="success"
              variant="outlined"
              sx={{ height: 20, fontSize: "0.65rem" }}
            />
          )}
          <Typography variant="caption" color="text.secondary">
            {hasDiscount ? "total pieza c/dto." : "total pieza"}
          </Typography>
        </Box>
        <Box sx={{ textAlign: "right" }}>
          {hasDiscount && (
            <Typography variant="caption" color="text.disabled" sx={{ textDecoration: "line-through", display: "block", lineHeight: 1 }}>
              {fmt(piece.subtotalPoints)}
            </Typography>
          )}
          <Typography variant="body2" fontWeight={700} color={hasDiscount ? "success.main" : "primary.main"}>
            {fmt(piece.finalPricePoints)}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default function PriceBreakdownPanel({
  piecesBreakdown,
  originalPoints,
  subtotalPoints,
  discountAmount = 0,
}: PriceBreakdownPanelProps) {
  if (!piecesBreakdown || piecesBreakdown.length === 0) {
    return (
      <Alert severity="info" variant="outlined" sx={{ fontSize: "0.78rem" }}>
        El desglose de precios estará disponible en nuevos presupuestos.
      </Alert>
    );
  }

  const hasDiscount = discountAmount > 0;

  return (
    <Box>
      {piecesBreakdown.map((piece, i) => (
        <PieceBlock key={piece.id || i} piece={piece} index={i} />
      ))}

      <Divider sx={{ my: 1.5 }} />

      {/* Totales del ítem */}
      <Stack spacing={0.5}>
        {hasDiscount && (
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="caption" color="text.secondary">
              Subtotal bruto
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ textDecoration: "line-through" }}>
              {fmt(originalPoints)}
            </Typography>
          </Box>
        )}
        {hasDiscount && (
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="caption" color="success.main" fontWeight={600}>
              Descuento
            </Typography>
            <Typography variant="caption" color="success.main" fontWeight={600}>
              -{fmt(discountAmount)}
            </Typography>
          </Box>
        )}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="body2" fontWeight={700}>
            Total estancia
          </Typography>
          <Typography variant="subtitle1" fontWeight={800} color="primary.main">
            {fmt(subtotalPoints)}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}
