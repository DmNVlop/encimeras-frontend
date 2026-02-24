import React from "react";
import { Paper, Typography, Box, Stack, alpha, useTheme } from "@mui/material";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";

import type { AppliedRule } from "@/interfases/price.interfase";

interface AppliedDiscountsProps {
  appliedRules: AppliedRule[];
}

export const AppliedDiscounts: React.FC<AppliedDiscountsProps> = ({ appliedRules }) => {
  const theme = useTheme();

  if (!appliedRules || appliedRules.length === 0) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        bgcolor: alpha(theme.palette.success.main, 0.05),
        borderRadius: 3,
        border: `1px dashed ${theme.palette.success.main}`,
        mb: 2,
      }}
    >
      <Typography variant="subtitle2" fontWeight="800" color="success.main" sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
        <LocalOfferIcon sx={{ fontSize: "1rem" }} /> Descuentos Aplicados
      </Typography>
      <Stack spacing={0.5}>
        {appliedRules.map((rule, ridx) => (
          <Box key={ridx} sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {rule.ruleName}
            </Typography>
            <Typography variant="body2" color="success.main" fontWeight="bold">
              -{rule.discountAmount.toFixed(2)} Pts
            </Typography>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
};
