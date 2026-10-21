import React from "react";
import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Chip, Stack, Typography } from "@mui/material";
import { ExpandMore as ExpandMoreIcon, Straighten as StraightenIcon } from "@mui/icons-material";
import type { OrderLineItem } from "@/interfases/orders.interfase";
import PriceBreakdownPanel from "@/components/cart/PriceBreakdownPanel";

const formatCode = (code: string) =>
  code
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());

// ─────────────────────────────────────────────────────────────────────────────
// FILA DETALLE DE PIEZA
// ─────────────────────────────────────────────────────────────────────────────
function PieceRow({ piece, index, materialsMap }: { piece: any; index: number; materialsMap: Map<string, string> }) {
  const materialName = materialsMap.get(piece.materialId) || "Material no especificado";
  const length = piece.length_mm ?? piece.measurements?.length_mm ?? 0;
  const width = piece.width_mm ?? piece.measurements?.width_mm ?? 0;
  const addons: any[] = piece.appliedAddons || [];

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 1.5,
        py: 0.75,
        px: 1.25,
        borderRadius: 2,
        bgcolor: "grey.50",
        mb: 0.75,
        border: "1px solid",
        borderColor: "grey.200",
      }}
    >
      {/* Número pieza */}
      <Box
        sx={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          bgcolor: "primary.main",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {index + 1}
      </Box>

      {/* Material */}
      <Box sx={{ flex: 1, minWidth: 160 }}>
        <Typography variant="body2" fontWeight={700} color="text.primary">
          {materialName}
        </Typography>
        {/* Atributos del material */}
        {piece.selectedAttributes && Object.keys(piece.selectedAttributes).length > 0 && (
          <Stack direction="row" flexWrap="wrap" gap={0.5} mt={0.5}>
            {Object.entries(piece.selectedAttributes).map(([k, v]) => (
              <Chip
                key={k}
                label={`${formatCode(k)}: ${String(v)}`}
                size="small"
                variant="outlined"
                sx={{ fontSize: "0.7rem", height: 20, bgcolor: "white" }}
              />
            ))}
          </Stack>
        )}
      </Box>

      {/* Dimensiones */}
      <Box sx={{ minWidth: 130, display: "flex", alignItems: "flex-start", gap: 0.5 }}>
        <StraightenIcon sx={{ fontSize: 16, color: "text.secondary", mt: 0.25 }} />
        <Typography variant="body2" fontWeight={600} color="primary.main">
          {length} × {width} mm
        </Typography>
      </Box>

      {/* Trabajos */}
      <Box sx={{ minWidth: 160 }}>
        {addons.length === 0 ? (
          <Typography variant="caption" color="text.disabled" fontStyle="italic">
            Corte limpio básico
          </Typography>
        ) : (
          addons.map((addon: any, i: number) => {
            const measStr = addon.measurements
              ? Object.entries(addon.measurements)
                  .filter(([k]) => k !== "quantity")
                  .map(([k, v]) => `${formatCode(k.replace("_mm", "").replace("_ml", ""))}: ${v}`)
                  .join(", ")
              : "";
            const qty = addon.measurements?.quantity ?? addon.quantity;
            return (
              <Typography key={i} variant="caption" display="block" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                • <strong>{formatCode(addon.code)}</strong>
                {qty ? ` × ${qty}` : ""}
                {measStr ? ` (${measStr})` : ""}
              </Typography>
            );
          })
        )}
      </Box>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ACORDEÓN DE ESTANCIA
// ─────────────────────────────────────────────────────────────────────────────
function LineItemAccordion({ item, index }: { item: OrderLineItem; index: number }) {
  const hasPricedBreakdown = Array.isArray(item.piecesBreakdown) && item.piecesBreakdown.length > 0;

  // Fallback legacy: construir vista técnica sin precios si no hay breakdown
  const materialsMap = new Map<string, string>();
  const materials: any[] = item.hydratedContext?.materials || item.technicalSnapshot?.materials || [];
  materials.forEach((m: any) => {
    if (m._id) materialsMap.set(m._id, m.name || m.materialName);
    if (m.id) materialsMap.set(m.id, m.name || m.materialName);
  });
  const mainPieces: any[] = item.core?.mainPieces || item.technicalSnapshot?.pieces || item.technicalSnapshot?.mainPieces || [];
  const pieceCount = hasPricedBreakdown ? item.piecesBreakdown!.length : mainPieces.length;

  return (
    <Accordion
      defaultExpanded={index === 0}
      sx={{
        mb: 1,
        borderRadius: "8px !important",
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "none",
        "&:before": { display: "none" },
        overflow: "hidden",
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          bgcolor: "grey.50",
          borderLeft: "4px solid",
          borderLeftColor: "primary.main",
          "& .MuiAccordionSummary-content": { alignItems: "center", justifyContent: "space-between", mr: 1 },
        }}
      >
        <Typography variant="subtitle2" fontWeight={700}>
          {item.cartItemName || `Estancia ${index + 1}`}
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="caption" color="text.secondary">
            {pieceCount} pieza{pieceCount !== 1 ? "s" : ""}
          </Typography>
          <Typography variant="subtitle2" fontWeight={700} color="primary.main">
            {(item.subtotalPoints ?? 0).toFixed(2)}
          </Typography>
        </Stack>
      </AccordionSummary>

      <AccordionDetails sx={{ p: 1.5 }}>
        {hasPricedBreakdown ? (
          <PriceBreakdownPanel
            piecesBreakdown={item.piecesBreakdown!}
            originalPoints={item.originalPoints ?? item.subtotalPoints}
            subtotalPoints={item.subtotalPoints}
            discountAmount={item.discountAmount}
          />
        ) : mainPieces.length === 0 ? (
          <Alert severity="info" variant="outlined">
            Los detalles técnicos de esta estancia no están disponibles.
          </Alert>
        ) : (
          <>
            {mainPieces.map((piece: any, i: number) => (
              <PieceRow key={piece.id || i} piece={piece} index={i} materialsMap={materialsMap} />
            ))}
            {item.discountAmount > 0 && (
              <Box sx={{ mt: 1.5, textAlign: "right" }}>
                <Typography variant="caption" color="text.secondary">
                  Precio original: <s>{(item.originalPoints ?? 0).toFixed(2)}</s>
                </Typography>
                <Typography variant="caption" color="success.main" fontWeight={600} sx={{ ml: 1.5 }}>
                  Descuento: -{item.discountAmount.toFixed(2)}
                </Typography>
              </Box>
            )}
          </>
        )}
      </AccordionDetails>
    </Accordion>
  );
}

/** Estancias de una orden (desglose con precios o, en órdenes antiguas, vista técnica sin precios). Portal y backoffice. */
export const OrderLineItems: React.FC<{ items?: OrderLineItem[] }> = ({ items = [] }) =>
  items.length > 0 ? (
    <>
      {items.map((item, i) => (
        <LineItemAccordion key={item.cartItemId || i} item={item} index={i} />
      ))}
    </>
  ) : (
    <Alert severity="info" variant="outlined">
      Esta orden no tiene líneas de detalle disponibles.
    </Alert>
  );

export default OrderLineItems;
