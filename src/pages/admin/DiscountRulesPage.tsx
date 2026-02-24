import React, { useState, useEffect, useCallback } from "react";
import { Box, Typography, Stack, Button, useTheme, alpha, Paper, CircularProgress } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

import AdminPageTitle from "./components/AdminPageTitle";
import DiscountRuleItem from "./discount-rules/DiscountRuleItem";
import DiscountRuleDrawer from "./discount-rules/DiscountRuleDrawer";
import type { IDiscountRule } from "@/interfases/discount-rule.interfase";
import { getDiscountRules } from "@/services/discount-rule.service";

const DiscountRulesPage: React.FC = () => {
  const theme = useTheme();
  const [rules, setRules] = useState<IDiscountRule[]>([]);
  const [loading, setLoading] = useState(true);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<IDiscountRule | null>(null);
  const [isNew, setIsNew] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDiscountRules();
      setRules(data);
    } catch (error) {
      console.error("Error loading rules:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateNew = () => {
    setSelectedRule(null);
    setIsNew(true);
    setDrawerOpen(true);
  };

  const handleRuleClick = (rule: IDiscountRule) => {
    setSelectedRule(rule);
    setIsNew(false);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedRule(null);
    setIsNew(false);
  };

  return (
    <Box sx={{ pb: 8 }}>
      {/* Header Section */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "flex-end" }} sx={{ mb: 5 }} spacing={3}>
        <Box>
          <AdminPageTitle>Reglas de Descuento</AdminPageTitle>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1, opacity: 0.8 }}>
            Configura el motor de precios dinámicos para tu fábrica.
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="secondary"
          startIcon={<AddIcon />}
          onClick={handleCreateNew}
          sx={{
            borderRadius: 3,
            fontWeight: 800,
            px: 4,
            py: 1.5,
            boxShadow: `0 8px 16px -4px ${alpha(theme.palette.secondary.main, 0.4)}`,
            textTransform: "none",
            fontSize: "1rem",
          }}
        >
          Nueva Regla
        </Button>
      </Stack>

      {/* Info Card */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 4,
          background: alpha(theme.palette.info.main, 0.05),
          border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
        }}
      >
        <Typography variant="body2" color="info.main" sx={{ fontWeight: 600 }}>
          💡 Las reglas se aplican automáticamente según su prioridad y el cumplimiento de las condiciones (fechas, tipo de cliente, etc.).
        </Typography>
      </Paper>

      {/* Main List Container */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 6,
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          background: alpha(theme.palette.background.paper, 0.3),
          backdropFilter: "blur(20px)",
          minHeight: 200,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {loading ? (
          <Box sx={{ py: 10, textAlign: "center" }}>
            <CircularProgress color="secondary" />
          </Box>
        ) : rules.length === 0 ? (
          <Box sx={{ py: 10, textAlign: "center" }}>
            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
              No hay reglas de descuento configuradas.
            </Typography>
          </Box>
        ) : (
          <Box>
            <Box sx={{ px: 2.5, mb: 1, display: { xs: "none", md: "flex" }, alignItems: "center", opacity: 0.5 }}>
              <Typography variant="overline" sx={{ flex: 2, fontWeight: 800 }}>
                REGLA / ALCANCE
              </Typography>
              <Typography variant="overline" sx={{ flex: 1, textAlign: "center", fontWeight: 800 }}>
                VALOR
              </Typography>
              <Typography variant="overline" sx={{ flex: 2, fontWeight: 800 }}>
                CONDICIONES
              </Typography>
              <Typography variant="overline" sx={{ mr: 2, fontWeight: 800 }}>
                ESTADO
              </Typography>
              <Box sx={{ width: 40 }} />
            </Box>
            {rules.map((rule) => (
              <DiscountRuleItem
                key={rule._id}
                rule={rule}
                onClick={handleRuleClick}
                onActionClick={(e) => {
                  e.stopPropagation();
                  handleRuleClick(rule);
                }}
              />
            ))}
          </Box>
        )}
      </Paper>

      {/* Details Drawer */}
      <DiscountRuleDrawer open={drawerOpen} rule={selectedRule} isNew={isNew} onClose={handleCloseDrawer} onRefresh={fetchData} />
    </Box>
  );
};

export default DiscountRulesPage;
