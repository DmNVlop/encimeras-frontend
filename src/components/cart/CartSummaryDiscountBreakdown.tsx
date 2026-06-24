import React, { useState } from "react";
import {
  Box,
  Typography,
  Collapse,
  Stack,
  Divider,
  IconButton,
  alpha,
  useTheme,
} from "@mui/material";
import {
  LocalOffer as LocalOfferIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import type { CartItem, AppliedDiscountDto } from "@/interfases/cart.interfase";

interface CartSummaryDiscountBreakdownProps {
  items: CartItem[];
  appliedGlobalRules?: AppliedDiscountDto[];
}

const fmt = (n: number) =>
  n.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/**
 * Per-item discount breakdown row (compact, for summary section)
 */
function ItemDiscountRow({
  itemName,
  itemDiscountAmount,
  rules,
  isExpanded,
  onToggle,
  theme,
}: {
  itemName: string;
  itemDiscountAmount: number;
  rules: AppliedDiscountDto[];
  isExpanded: boolean;
  onToggle: () => void;
  theme: any;
}) {
  const totalDiscount = itemDiscountAmount;
  const hasRules = rules.length > 0;

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: hasRules ? "pointer" : "default",
          py: 0.5,
          px: 1,
          borderRadius: 1,
          bgcolor: alpha(theme.palette.success.main, 0.02),
          "&:hover": hasRules
            ? { bgcolor: alpha(theme.palette.success.main, 0.08) }
            : {},
          transition: "background-color 0.2s",
        }}
        onClick={onToggle}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flex: 1 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 500 }}
          >
            {itemName}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Typography
            variant="caption"
            fontWeight={700}
            color="success.main"
            sx={{ whiteSpace: "nowrap" }}
          >
            -{fmt(totalDiscount)}
          </Typography>
          {hasRules && (
            <IconButton
              size="small"
              sx={{ p: 0, width: 20, height: 20, ml: 0.5 }}
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
            >
              <ExpandMoreIcon
                fontSize="small"
                sx={{
                  transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                  color: "success.main",
                }}
              />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Expanded rules list */}
      {hasRules && (
        <Collapse in={isExpanded}>
          <Box
            sx={{
              pl: 2.5,
              pr: 1,
              py: 0.75,
              borderLeft: "2px solid",
              borderColor: alpha(theme.palette.success.main, 0.3),
              ml: 0.5,
            }}
          >
            <Stack spacing={0.3}>
              {rules.map((rule, idx) => (
                <Box
                  key={`${rule.ruleId}-${idx}`}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    • {rule.ruleName}
                  </Typography>
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    color="success.main"
                    sx={{ whiteSpace: "nowrap" }}
                  >
                    −{fmt(rule.discountAmount)}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        </Collapse>
      )}
    </Box>
  );
}

/**
 * Cart summary discount breakdown component
 * Displays per-item discounts + global discounts + total savings
 */
export const CartSummaryDiscountBreakdown: React.FC<
  CartSummaryDiscountBreakdownProps
> = ({ items, appliedGlobalRules }) => {
  const theme = useTheme();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Filter items with applied rules
  const itemsWithRules = items.filter(
    (item) => item.appliedRules && item.appliedRules.length > 0
  );

  const hasItemDiscounts = itemsWithRules.length > 0;
  const hasGlobalDiscounts =
    appliedGlobalRules && appliedGlobalRules.length > 0;

  if (!hasItemDiscounts && !hasGlobalDiscounts) {
    return null;
  }

  const toggleItemExpanded = (itemId: string) => {
    const newSet = new Set(expandedItems);
    if (newSet.has(itemId)) {
      newSet.delete(itemId);
    } else {
      newSet.add(itemId);
    }
    setExpandedItems(newSet);
  };

  // Calculate totals usando discountAmount del ítem (calculado por backend), no la suma de reglas
  const totalItemDiscounts = itemsWithRules.reduce((sum, item) => sum + (item.discountAmount ?? 0), 0);

  const totalGlobalDiscounts =
    appliedGlobalRules?.reduce((sum, rule) => sum + rule.discountAmount, 0) ||
    0;

  const totalSavings = totalItemDiscounts + totalGlobalDiscounts;

  return (
    <Box>
      {/* Per-item discounts section */}
      {hasItemDiscounts && (
        <Box sx={{ mb: 1.5 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              mb: 0.75,
              pl: 0.5,
            }}
          >
            <LocalOfferIcon
              sx={{ fontSize: 14, color: "success.main", flexShrink: 0 }}
            />
            <Typography
              variant="caption"
              fontWeight={700}
              color="success.main"
              sx={{ textTransform: "uppercase", letterSpacing: 0.3, flex: 1 }}
            >
              Descuentos por ítems
            </Typography>
            <Typography
              variant="caption"
              fontWeight={700}
              color="success.main"
              sx={{ whiteSpace: "nowrap" }}
            >
              −{fmt(totalItemDiscounts)}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
              pl: 1,
            }}
          >
            {itemsWithRules.map((item, idx) => (
              <ItemDiscountRow
                key={item.cartItemId || item._id || `item-${idx}`}
                itemName={item.customName}
                itemDiscountAmount={item.discountAmount ?? 0}
                rules={item.appliedRules || []}
                isExpanded={expandedItems.has(
                  item.cartItemId || item._id || `item-${idx}`
                )}
                onToggle={() =>
                  toggleItemExpanded(
                    item.cartItemId || item._id || `item-${idx}`
                  )
                }
                theme={theme}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Divider between sections */}
      {hasItemDiscounts && hasGlobalDiscounts && (
        <Divider sx={{ my: 1, borderStyle: "dashed" }} />
      )}

      {/* Global discounts section */}
      {hasGlobalDiscounts && (
        <Box sx={{ mb: 1 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              mb: 0.75,
              pl: 0.5,
            }}
          >
            <LocalOfferIcon
              sx={{ fontSize: 14, color: "success.main", flexShrink: 0 }}
            />
            <Typography
              variant="caption"
              fontWeight={700}
              color="success.main"
              sx={{ textTransform: "uppercase", letterSpacing: 0.3, flex: 1 }}
            >
              Descuentos globales
            </Typography>
            <Typography
              variant="caption"
              fontWeight={700}
              color="success.main"
              sx={{ whiteSpace: "nowrap" }}
            >
              −{fmt(totalGlobalDiscounts)}
            </Typography>
          </Box>

          <Stack spacing={0.3} sx={{ pl: 2 }}>
            {appliedGlobalRules.map((rule, idx) => (
              <Box
                key={`global-${rule.ruleId}-${idx}`}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontStyle: "italic" }}
                >
                  • {rule.ruleName}
                </Typography>
                <Typography
                  variant="caption"
                  fontWeight={600}
                  color="success.main"
                  sx={{ whiteSpace: "nowrap" }}
                >
                  −{fmt(rule.discountAmount)}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      {/* Total savings */}
      {totalSavings > 0 && (
        <>
          <Divider sx={{ my: 1, borderStyle: "dashed" }} />
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
            <Typography
              variant="caption"
              fontWeight={700}
              color="success.main"
              sx={{ textTransform: "uppercase", letterSpacing: 0.3 }}
            >
              Ahorro Total
            </Typography>
            <Typography
              variant="body2"
              fontWeight={700}
              color="success.main"
              sx={{ fontSize: "1.1em" }}
            >
              −{fmt(totalSavings)}
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
};
