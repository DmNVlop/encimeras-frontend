import {
  Box,
  Typography,
  Divider,
  Chip,
  Collapse,
  IconButton,
  Alert,
  alpha,
  useTheme,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Straighten as StraightenIcon,
  Build as BuildIcon,
  LocalOffer as LocalOfferIcon,
} from "@mui/icons-material";
import { useState } from "react";
import type { PieceBreakdownItem } from "@/interfases/orders.interfase";
import type { AppliedDiscountDto } from "@/interfases/cart.interfase";
import { ItemDiscountRulesPanel } from "./ItemDiscountRulesPanel";

interface PriceBreakdownPanelProps {
  piecesBreakdown: PieceBreakdownItem[];
  itemName?: string;
  originalPoints: number;
  subtotalPoints: number;
  discountAmount?: number;
  appliedRules?: AppliedDiscountDto[];
}

const fmt = (n: number) =>
  n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Paleta de colores para el borde izquierdo de cada pieza
const PIECE_COLORS = ["#5C6BC0", "#26A69A", "#EF5350", "#FFA726", "#66BB6A", "#AB47BC"];

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
        alignItems: "center",
        py: 0.5,
        px: 1,
        borderRadius: 1,
        "&:hover": { bgcolor: "action.hover" },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flex: 1, minWidth: 0 }}>
        <BuildIcon sx={{ fontSize: 11, color: "text.disabled", flexShrink: 0 }} />
        <Typography variant="caption" color="text.secondary" noWrap>
          {addon.name || addon.addonName || addon.code}
          {qty}
        </Typography>
        {measStr && (
          <Typography variant="caption" color="text.disabled" sx={{ flexShrink: 0 }}>
            ({measStr})
          </Typography>
        )}
      </Box>
      <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ ml: 2, flexShrink: 0 }}>
        {fmt(addon.pricePoints)}
      </Typography>
    </Box>
  );
}

function PieceBlock({ piece, index }: { piece: PieceBreakdownItem; index: number }) {
  const theme = useTheme();
  const [open, setOpen] = useState(true);
  const hasAddons = piece.addons && piece.addons.length > 0;
  const hasDiscount = piece.discountAmount > 0;
  const accentColor = PIECE_COLORS[index % PIECE_COLORS.length];

  return (
    <Box
      sx={{
        borderRadius: 2,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
        borderLeft: `3px solid ${accentColor}`,
        mb: 1.5,
      }}
    >
      {/* Cabecera de pieza */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          px: 1.5,
          py: 0.875,
          bgcolor: alpha(accentColor, 0.04),
          cursor: hasAddons ? "pointer" : "default",
          userSelect: "none",
          gap: 1,
        }}
        onClick={() => hasAddons && setOpen((v) => !v)}
      >
        {/* Badge número */}
        <Box
          sx={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            bgcolor: accentColor,
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {index + 1}
        </Box>

        {/* Material */}
        <Typography variant="body2" fontWeight={700} sx={{ flex: 1, minWidth: 0 }} noWrap>
          {piece.materialName}
        </Typography>

        {/* Dimensiones */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.4, flexShrink: 0 }}>
          <StraightenIcon sx={{ fontSize: 11, color: "text.disabled" }} />
          <Typography variant="caption" color="text.secondary">
            {piece.length_mm} × {piece.width_mm} mm
          </Typography>
        </Box>

        {/* Base price */}
        <Box sx={{ textAlign: "right", ml: 1.5, flexShrink: 0 }}>
          <Typography variant="caption" color="text.disabled" display="block" sx={{ lineHeight: 1, mb: 0.25 }}>
            base
          </Typography>
          <Typography variant="body2" fontWeight={700}>
            {fmt(piece.basePricePoints)}
          </Typography>
        </Box>

        {hasAddons && (
          <IconButton size="small" sx={{ ml: 0.25, p: 0.25 }}>
            <ExpandMoreIcon
              sx={{
                fontSize: 16,
                transform: open ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
                color: accentColor,
              }}
            />
          </IconButton>
        )}
      </Box>

      {/* Addons */}
      {hasAddons && (
        <Collapse in={open}>
          <Box
            sx={{
              px: 1.5,
              pt: 0.75,
              pb: 0.5,
              borderTop: "1px dashed",
              borderColor: alpha(accentColor, 0.2),
            }}
          >
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ textTransform: "uppercase", letterSpacing: 0.4, fontSize: "0.6rem", display: "block", mb: 0.25, pl: 0.5 }}
            >
              Complementos
            </Typography>
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
          py: 0.625,
          bgcolor: hasDiscount ? alpha(theme.palette.success.main, 0.06) : alpha(accentColor, 0.06),
          borderTop: "1px solid",
          borderColor: hasDiscount ? alpha(theme.palette.success.main, 0.2) : alpha(accentColor, 0.15),
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          {hasDiscount && (
            <Chip
              icon={<LocalOfferIcon sx={{ fontSize: "10px !important" }} />}
              label={`-${fmt(piece.discountAmount)}`}
              size="small"
              color="success"
              variant="outlined"
              sx={{ height: 18, fontSize: "0.62rem", "& .MuiChip-label": { px: 0.75 } }}
            />
          )}
          <Typography variant="caption" color={hasDiscount ? "success.main" : "text.secondary"} fontWeight={hasDiscount ? 600 : 400}>
            {hasDiscount ? "total pieza c/dto." : "total pieza"}
          </Typography>
        </Box>
        <Box sx={{ textAlign: "right" }}>
          {hasDiscount && (
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ textDecoration: "line-through", display: "block", lineHeight: 1 }}
            >
              {fmt(piece.subtotalPoints)}
            </Typography>
          )}
          <Typography variant="body2" fontWeight={800} color={hasDiscount ? "success.main" : accentColor}>
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
  appliedRules,
}: PriceBreakdownPanelProps) {
  const theme = useTheme();

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

      {/* Sección descuentos globales del ítem */}
      {appliedRules && appliedRules.length > 0 && (
        <>
          <Divider sx={{ my: 1.5 }}>
            <Typography variant="caption" color="text.disabled" sx={{ textTransform: "uppercase", letterSpacing: 0.5, fontSize: "0.6rem" }}>
              Descuentos aplicados
            </Typography>
          </Divider>
          <ItemDiscountRulesPanel appliedRules={appliedRules} />
        </>
      )}

      {/* Totales del ítem */}
      <Box
        sx={{
          mt: 1.5,
          pt: 1.5,
          borderTop: "2px solid",
          borderColor: "divider",
        }}
      >
        {hasDiscount && (
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
            <Typography variant="caption" color="text.disabled">
              Subtotal bruto
            </Typography>
            <Typography variant="caption" color="text.disabled" sx={{ textDecoration: "line-through" }}>
              {fmt(originalPoints)}
            </Typography>
          </Box>
        )}
        {hasDiscount && !(appliedRules && appliedRules.length > 0) && (
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
            <Typography variant="caption" color="success.main" fontWeight={600}>
              Descuento total
            </Typography>
            <Typography variant="caption" color="success.main" fontWeight={600}>
              −{fmt(discountAmount)}
            </Typography>
          </Box>
        )}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mt: 0.5,
            px: 1.5,
            py: 0.75,
            borderRadius: 1.5,
            bgcolor: alpha(theme.palette.primary.main, 0.06),
          }}
        >
          <Typography variant="body2" fontWeight={700} color="text.secondary">
            Total estancia
          </Typography>
          <Typography variant="subtitle1" fontWeight={800} color="primary.main">
            {fmt(subtotalPoints)}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
