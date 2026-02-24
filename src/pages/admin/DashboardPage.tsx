import React from "react";
import { Box, Grid, Typography, Button, Stack, useTheme } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import DescriptionIcon from "@mui/icons-material/Description";
import ArchitectureIcon from "@mui/icons-material/Architecture";
import StraightenIcon from "@mui/icons-material/Straighten";
import LayersIcon from "@mui/icons-material/Layers";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";

// --- HOOKS Y COMPONENTES ---
import { useDashboard } from "./components/dashboard/useDashboard";
import { DashboardHeader } from "./components/dashboard/DashboardHeader";
import { DashboardFilters } from "./components/dashboard/DashboardFilters";
import { StatCard } from "./components/dashboard/StatCard";
import { TrendsChart } from "./components/dashboard/TrendsChart";
import { DistributionCharts } from "./components/dashboard/DistributionCharts";
import { AddonsRankingChart } from "./components/dashboard/AddonsRankingChart";

const DashboardPage: React.FC = () => {
  const theme = useTheme();
  const {
    loading,
    error,
    lastUpdated,
    filters,
    fetchData,
    handleFilterChange,
    handleResetFilters,
    summary,
    materialsData,
    shapesData,
    addonsData,
    trendsData,
  } = useDashboard();

  if (error) {
    return (
      <Box
        sx={{
          p: 4,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
        }}
      >
        <Typography variant="h6" color="error" gutterBottom>
          {error}
        </Typography>
        <Button variant="contained" onClick={fetchData} startIcon={<RefreshIcon />} sx={{ mt: 2, borderRadius: 3, px: 4, py: 1.5 }}>
          Reintentar Carga
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 8 }}>
      {/* Header Section */}
      <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", lg: "flex-end" }} sx={{ mb: 5 }} spacing={3}>
        <DashboardHeader lastUpdated={lastUpdated} loading={loading} />

        {/* Filter Bar */}
        <DashboardFilters
          filters={filters}
          loading={loading}
          onFilterChange={handleFilterChange}
          onApplyFilters={fetchData}
          onResetFilters={handleResetFilters}
        />
      </Stack>

      <Grid container spacing={4}>
        {/* Top KPIs Row */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
          <StatCard
            title="Total Presupuestos"
            value={summary?.totalQuotes.toLocaleString() || "0"}
            icon={<DescriptionIcon />}
            loading={loading}
            color={theme.palette.primary.main}
            subtitle="Volumen total de documentos"
            info="Cantidad acumulada de presupuestos creados, incluyendo tanto borradores activos como pedidos ya confirmados."
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
          <StatCard
            title="Valor en Puntos"
            value={summary?.totalPoints.toLocaleString() || "0"}
            icon={<MonetizationOnIcon />}
            loading={loading}
            color={theme.palette.secondary.main}
            subtitle="Potencial de negocio"
            info="Valor total acumulado del negocio. Suma el precio de los pedidos vendidos y el valor de las cotizaciones en curso."
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
          <StatCard
            title="Promedio por Proyecto"
            value={summary?.avgPointsPerProject.toFixed(1) || "0"}
            icon={<TrendingUpIcon />}
            loading={loading}
            color={theme.palette.success.main}
            subtitle="Rentabilidad media"
            info="Indica la rentabilidad media por cada presupuesto. Se calcula dividiendo el valor total en puntos por la cantidad de proyectos."
          />
        </Grid>

        {/* Secondary KPIs Row */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Superficie Total"
            value={`${summary?.totalSqm.toFixed(1) || "0"} m²`}
            icon={<LayersIcon />}
            loading={loading}
            color={theme.palette.info.main}
            info="Suma de la superficie total de todas las piezas (largo * ancho) convertida a metros cuadrados."
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Longitud Acabados"
            value={`${summary?.totalMl.toFixed(1) || "0"} ml`}
            icon={<StraightenIcon />}
            loading={loading}
            color={theme.palette.warning.main}
            info="Longitud total en metros lineales de acabados como copetes, cantos y otros añadidos que requieren mecanizado lineal."
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Piezas por Proyecto"
            value={summary?.avgPiecesPerProject.toFixed(1) || "0"}
            icon={<ArchitectureIcon />}
            loading={loading}
            color={theme.palette.error.main}
            subtitle="Complejidad técnica media"
            info="Promedio de piezas físicas que componen cada presupuesto. A mayor número, mayor complejidad técnica y logística del proyecto."
          />
        </Grid>

        {/* Trends Chart Section */}
        <Grid size={{ xs: 12 }}>
          <TrendsChart data={trendsData} loading={loading} />
        </Grid>

        {/* Distribution Charts (Materials & Shapes) */}
        <Grid size={{ xs: 12 }}>
          <DistributionCharts materialsData={materialsData} shapesData={shapesData} totalQuotes={summary?.totalQuotes} loading={loading} />
        </Grid>

        {/* Addons Ranking Chart */}
        <Grid size={{ xs: 12 }}>
          <AddonsRankingChart data={addonsData} loading={loading} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
