import React from "react";
import { Box, Typography, Stack, alpha, useTheme } from "@mui/material";
import { LocalOffer as LocalOfferIcon } from "@mui/icons-material";
import type { AppliedDiscountDto } from "@/interfases/cart.interfase";

interface ItemDiscountRulesPanelProps {
  appliedRules?: AppliedDiscountDto[];
}

const fmt = (n: number) => n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const ItemDiscountRulesPanel: React.FC<ItemDiscountRulesPanelProps> = ({ appliedRules }) => {
  const theme = useTheme();

  if (!appliedRules || appliedRules.length === 0) return null;

  return (
    <Box
      sx={{
        p: 1.5,
        bgcolor: alpha(theme.palette.success.main, 0.05),
        borderRadius: 1.5,
        border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
        mt: 1,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1 }}>
        <LocalOfferIcon sx={{ fontSize: 14, color: "success.main" }} />
        <Typography variant="caption" fontWeight={700} color="success.main" sx={{ textTransform: "uppercase", letterSpacing: 0.3 }}>
          Descuentos Aplicados
        </Typography>
      </Box>
      <Stack spacing={0.5}>
        {appliedRules.map((rule, idx) => (
          <Box key={`${rule.ruleId}-${idx}`} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
            <Typography variant="caption" color="success.main" sx={{ flex: 1, wordBreak: "break-word" }}>
              • {rule.ruleName}
            </Typography>
            <Typography variant="caption" fontWeight={700} color="success.main" sx={{ flexShrink: 0 }}>
              −{fmt(rule.discountAmount)}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};
