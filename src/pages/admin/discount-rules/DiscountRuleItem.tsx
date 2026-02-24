import React from "react";
import { Box, Typography, Stack, Chip, IconButton, useTheme, alpha, Paper } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import LocalActivityIcon from "@mui/icons-material/LocalActivity";
import PercentIcon from "@mui/icons-material/Percent";
import EuroIcon from "@mui/icons-material/Euro";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PeopleIcon from "@mui/icons-material/People";
import type { IDiscountRule } from "@/interfases/discount-rule.interfase";
import { DiscountType, DiscountScope } from "@/interfases/discount-rule.interfase";

interface DiscountRuleItemProps {
  rule: IDiscountRule;
  onClick: (rule: IDiscountRule) => void;
  onActionClick: (e: React.MouseEvent, rule: IDiscountRule) => void;
}

const DiscountRuleItem: React.FC<DiscountRuleItemProps> = ({ rule, onClick, onActionClick }) => {
  const theme = useTheme();
  const isPercentage = rule.type === DiscountType.PERCENTAGE;

  const getScopeLabel = (scope: DiscountScope) => {
    switch (scope) {
      case DiscountScope.GLOBAL_TOTAL:
        return "Global";
      case DiscountScope.SPECIFIC_MATERIALS:
        return "Materiales";
      case DiscountScope.MATERIAL_CATEGORIES:
        return "Categorías";
      default:
        return scope;
    }
  };

  return (
    <Paper
      elevation={0}
      onClick={() => onClick(rule)}
      sx={{
        p: 2.5,
        mb: 1.5,
        borderRadius: 4,
        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        background: alpha(theme.palette.background.paper, 0.5),
        backdropFilter: "blur(10px)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        opacity: rule.isActive ? 1 : 0.6,
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: `0 12px 24px -10px ${alpha(theme.palette.common.black, 0.1)}`,
          borderColor: alpha(theme.palette.secondary.main, 0.2),
          background: theme.palette.background.paper,
        },
      }}
    >
      <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center" }}>
        {/* Info Column */}
        <Box sx={{ flex: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                color: theme.palette.secondary.main,
              }}
            >
              <LocalActivityIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "text.primary" }}>
                {rule.name}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", fontWeight: 700, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 0.5 }}
              >
                {getScopeLabel(rule.scope)} • Prioridad {rule.priority}
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Value Column */}
        <Box sx={{ flex: 1, textAlign: "center" }}>
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
            <Typography variant="h6" sx={{ fontWeight: 900, color: theme.palette.secondary.main }}>
              {isPercentage ? `${rule.value}%` : `${rule.value}€`}
            </Typography>
            {isPercentage ? <PercentIcon sx={{ fontSize: 16, opacity: 0.5 }} /> : <EuroIcon sx={{ fontSize: 16, opacity: 0.5 }} />}
          </Stack>
        </Box>

        {/* Conditions Column */}
        <Box sx={{ flex: 2 }}>
          <Stack spacing={0.5}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <PeopleIcon sx={{ fontSize: 14, color: "text.secondary", opacity: 0.5 }} />
              <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600, fontSize: "0.8rem" }}>
                {rule.conditions.customerStrategy === "ALL" ? "Todos los clientes" : `${rule.conditions.targetCustomers.length} clientes esp.`}
              </Typography>
            </Box>
            {(rule.conditions.startDate || rule.conditions.endDate) && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CalendarTodayIcon sx={{ fontSize: 14, color: "text.secondary", opacity: 0.5 }} />
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500, fontSize: "0.75rem" }}>
                  {rule.conditions.startDate ? new Date(rule.conditions.startDate).toLocaleDateString() : "∞"} -{" "}
                  {rule.conditions.endDate ? new Date(rule.conditions.endDate).toLocaleDateString() : "∞"}
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>

        {/* Status */}
        <Box sx={{ mr: 2 }}>
          <Chip
            label={rule.isActive ? "Activa" : "Inactiva"}
            size="small"
            variant="outlined"
            color={rule.isActive ? "success" : "default"}
            sx={{ fontWeight: 700, borderRadius: 1.5, fontSize: "0.65rem", height: 20 }}
          />
        </Box>

        {/* Actions */}
        <Box>
          <IconButton size="small" onClick={(e) => onActionClick(e, rule)}>
            <MoreVertIcon />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
};

export default DiscountRuleItem;
