import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Skeleton,
  useTheme,
  IconButton,
  Button,
  Stack,
  Tooltip,
  Paper,
  alpha,
  MenuItem,
  TextField,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
} from "@mui/material";
import { BarChart, PieChart, LineChart } from "@mui/x-charts";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import DescriptionIcon from "@mui/icons-material/Description";
import ArchitectureIcon from "@mui/icons-material/Architecture";
import StraightenIcon from "@mui/icons-material/Straighten";
import LayersIcon from "@mui/icons-material/Layers";
import FilterListIcon from "@mui/icons-material/FilterList";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";

import AdminPageTitle from "./components/AdminPageTitle";
import { getAnalyticsSummary, type AnalyticsSummaryResponse, type AnalyticsFilters } from "@/services/analytics.service";

/**
 * KPI Card Component with Glassmorphism and Premium feel
 */
const StatCard = ({ title, value, subtitle, icon, loading, color, info }: any) => {
  const theme = useTheme();
  return (
    <Card
      sx={{
        height: "100%",
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
        backdropFilter: "blur(12px)",
        borderRadius: 5,
        border: `1px solid ${alpha(color || theme.palette.divider, 0.12)}`,
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          transform: "translateY(-8px)",
          boxShadow: `0 24px 48px -12px ${alpha(color || theme.palette.common.black, 0.2)}, 0 12px 24px -12px ${alpha(color || theme.palette.common.black, 0.08)}`,
          borderColor: alpha(color || theme.palette.primary.main, 0.4),
          "& .icon-container": {
            transform: "scale(1.1) rotate(5deg)",
            boxShadow: `0 12px 20px -5px ${alpha(color || theme.palette.primary.main, 0.35)}`,
          },
        },
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: -30,
          right: -30,
          width: 140,
          height: 140,
          background: `radial-gradient(circle, ${alpha(color || theme.palette.primary.main, 0.15)} 0%, transparent 75%)`,
          borderRadius: "50%",
          zIndex: 0,
        }}
      />
      <CardContent sx={{ p: 3.5, position: "relative", zIndex: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Box sx={{ flexGrow: 1 }}>
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1.5 }}>
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ fontWeight: 800, letterSpacing: 1.5, display: "block", opacity: 0.7, textTransform: "uppercase", fontSize: "0.7rem" }}
              >
                {title}
              </Typography>
              {info && (
                <Tooltip title={info} arrow placement="top">
                  <InfoOutlinedIcon sx={{ fontSize: 16, color: "text.secondary", opacity: 0.4, cursor: "help" }} />
                </Tooltip>
              )}
            </Stack>
            {loading ? (
              <Skeleton width="80%" height={56} sx={{ my: 0.5, borderRadius: 2 }} />
            ) : (
              <Typography variant="h3" sx={{ fontWeight: 900, fontSize: "2.2rem", color: color, letterSpacing: "-0.03em", mb: 0.5 }}>
                {value}
              </Typography>
            )}
            {subtitle && !loading && (
              <Typography variant="caption" sx={{ display: "flex", alignItems: "center", mt: 1.5, fontWeight: 600, color: "text.secondary", opacity: 0.8 }}>
                <TrendingUpIcon sx={{ fontSize: 16, mr: 0.5, color: "success.main" }} />
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            className="icon-container"
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 60,
              height: 60,
              borderRadius: 4,
              background: `linear-gradient(135deg, ${alpha(color || theme.palette.primary.main, 0.2)} 0%, ${alpha(color || theme.palette.primary.main, 0.05)} 100%)`,
              color: color || theme.palette.primary.main,
              boxShadow: `0 8px 20px -6px ${alpha(color || theme.palette.primary.main, 0.2)}`,
              transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {React.cloneElement(icon, { sx: { fontSize: 32 } })}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

const DashboardPage: React.FC = () => {
  const theme = useTheme();
  const [data, setData] = useState<AnalyticsSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Filters State
  const [filters, setFilters] = useState<AnalyticsFilters>({
    status: "all",
    startDate: "",
    endDate: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const activeFilters: AnalyticsFilters = {};
      if (filters.status && filters.status !== "all") activeFilters.status = filters.status;
      if (filters.startDate) activeFilters.startDate = filters.startDate;
      if (filters.endDate) activeFilters.endDate = filters.endDate;
      if (filters.factoryId) activeFilters.factoryId = filters.factoryId;

      const response = await getAnalyticsSummary(activeFilters);
      setData(response);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error("Error loading analytics:", err);
      setError("No se pudieron cargar los datos del panel. Verifica los filtros o intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (field: keyof AnalyticsFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      status: "all",
      startDate: "",
      endDate: "",
    });
  };

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <Typography variant="h6" color="error" gutterBottom>
          {error}
        </Typography>
        <Button variant="contained" onClick={fetchData} startIcon={<RefreshIcon />} sx={{ mt: 2, borderRadius: 3, px: 4, py: 1.5 }}>
          Reintentar Carga
        </Button>
      </Box>
    );
  }

  const summary = data?.summary;
  const materialsData =
    data?.charts.materials.map((m, index) => ({
      id: m.id,
      value: m.count,
      label: `${m.name} (${m.percentage.toFixed(1)}%)`,
      color: [
        theme.palette.primary.main,
        theme.palette.secondary.main,
        theme.palette.success.main,
        theme.palette.warning.main,
        theme.palette.info.main,
        theme.palette.error.main,
      ][index % 6],
    })) || [];

  const shapesData =
    data?.charts.shapes.map((s, index) => ({
      id: s.id,
      value: s.value,
      label: s.label
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" "),
      color: [
        theme.palette.primary.light,
        theme.palette.secondary.light,
        theme.palette.success.light,
        theme.palette.warning.light,
        theme.palette.info.light,
        theme.palette.error.light,
      ][index % 6],
    })) || [];

  const addonsData = data?.charts.addons
    ? [...data.charts.addons]
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map((a) => ({
          ...a,
          label: a.label.length > 25 ? a.label.substring(0, 22) + "..." : a.label,
        }))
    : [];

  const trendsData = data?.trends.dailyQuotes || [];

  return (
    <Box sx={{ pb: 8 }}>
      {/* Header Section */}
      <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", lg: "flex-end" }} sx={{ mb: 5 }} spacing={3}>
        <Box>
          <AdminPageTitle>Dashboard Operativo</AdminPageTitle>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1, opacity: 0.8, fontStyle: "italic", display: "flex", alignItems: "center" }}>
            Métricas clave de producción y ventas.
            {lastUpdated && !loading && (
              <Box component="span" sx={{ ml: 2, fontSize: "0.75rem", opacity: 0.6, fontWeight: 400 }}>
                Actualizado: {lastUpdated.toLocaleTimeString()}
              </Box>
            )}
          </Typography>
        </Box>

        {/* Filter Bar */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            px: 3,
            borderRadius: 5,
            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            backgroundColor: alpha(theme.palette.background.paper, 0.6),
            backdropFilter: "blur(20px)",
            boxShadow: `0 10px 30px -10px ${alpha(theme.palette.common.black, 0.05)}`,
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontWeight: 600 }}>Criterio de Inclusión</InputLabel>
                <Select
                  value={filters.status}
                  label="Criterio de Inclusión"
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  sx={{ borderRadius: 3, fontWeight: 500 }}
                >
                  <MenuItem value="all">Todo el Flujo</MenuItem>
                  <MenuItem value="order">Solo Pedidos (Cerrado)</MenuItem>
                  <MenuItem value="draft">Solo Borradores (Preventa)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="Desde"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarTodayIcon fontSize="small" sx={{ color: "primary.main", opacity: 0.7 }} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 3 },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="Hasta"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarTodayIcon fontSize="small" sx={{ color: "primary.main", opacity: 0.7 }} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 3 },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Stack direction="row" spacing={1}>
                <Button
                  fullWidth
                  variant="contained"
                  disableElevation
                  startIcon={<FilterListIcon />}
                  onClick={fetchData}
                  disabled={loading}
                  sx={{ borderRadius: 3, fontWeight: 700, py: 1.2, boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.3)}` }}
                >
                  Actualizar
                </Button>
                <Tooltip title="Restablecer filtros">
                  <IconButton
                    onClick={handleResetFilters}
                    sx={{
                      borderRadius: 3,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      transition: "all 0.2s",
                      "&:hover": { backgroundColor: alpha(theme.palette.primary.main, 0.05) },
                    }}
                  >
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Grid>
          </Grid>
        </Paper>
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
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 4 },
              borderRadius: 6,
              border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              background: `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${theme.palette.background.paper} 100%)`,
              boxShadow: "0 15px 35px -10px rgba(0,0,0,0.03)",
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: -0.5, fontSize: "1.4rem" }}>
                  Evolución Temporal
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Comparativa de volumen de presupuesto y valor acumulado
                </Typography>
              </Box>
              <Tooltip title="Muestra la tendencia diaria comparando cuántos presupuestos se crean frente al valor que representan. Ideal para detectar picos de demanda.">
                <IconButton size="small" sx={{ opacity: 0.6 }}>
                  <InfoOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>

            <Box sx={{ height: 450, width: "100%", mt: 2 }}>
              {loading ? (
                <Skeleton variant="rectangular" height="100%" sx={{ borderRadius: 4 }} />
              ) : trendsData.length > 0 ? (
                <LineChart
                  xAxis={[
                    {
                      data: trendsData.map((d) => new Date(d.date)),
                      scaleType: "time",
                      valueFormatter: (v: Date) =>
                        v.toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                        }),
                    },
                  ]}
                  series={[
                    {
                      data: trendsData.map((d) => d.count),
                      label: "Presupuestos",
                      area: true,
                      curve: "catmullRom",
                      color: alpha(theme.palette.primary.main, 0.6),
                    },
                    {
                      data: trendsData.map((d) => d.points),
                      label: "Valor (Pts)",
                      yAxisId: "points-axis",
                      curve: "catmullRom",
                      color: theme.palette.secondary.main,
                    },
                  ]}
                  yAxis={[
                    { id: "orders-axis", label: "Cantidad" },
                    { id: "points-axis", position: "right", label: "Puntos" },
                  ]}
                  height={400}
                  margin={{ top: 20, bottom: 50, left: 60, right: 80 }}
                  sx={{
                    "& .MuiLineElement-root:nth-of-type(2)": {
                      strokeWidth: 3,
                    },
                  }}
                  slotProps={{
                    legend: {
                      direction: "horizontal",
                      position: { vertical: "top", horizontal: "end" },
                    } as any,
                  }}
                />
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100%",
                    bgcolor: alpha(theme.palette.action.disabledBackground, 0.03),
                    borderRadius: 4,
                    border: `2px dashed ${alpha(theme.palette.divider, 0.2)}`,
                  }}
                >
                  <CalendarTodayIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2, opacity: 0.5 }} />
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    No hay suficientes datos para el rango seleccionado
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Mid Row: Materials and Shapes Distribution */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 7,
              border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              height: "100%",
              background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${theme.palette.background.paper} 100%)`,
              boxShadow: "0 20px 40px -15px rgba(0,0,0,0.05)",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <Typography variant="h6" sx={{ mb: 4, fontWeight: 900, fontSize: "1.3rem", letterSpacing: -0.5, display: "flex", alignItems: "center", gap: 1 }}>
              Distribución de Materiales
              <Tooltip title="Análisis de los materiales más solicitados. El porcentaje representa la 'cuota de mercado' interna dentro de la fábrica.">
                <InfoOutlinedIcon sx={{ fontSize: 18, color: "text.secondary", opacity: 0.5, cursor: "help" }} />
              </Tooltip>
            </Typography>
            <Box sx={{ height: 420, display: "flex", justifyContent: "center", position: "relative" }}>
              {loading ? (
                <Skeleton variant="circular" height={280} width={280} sx={{ mx: "auto" }} />
              ) : materialsData.length > 0 ? (
                <>
                  <PieChart
                    series={[
                      {
                        data: materialsData,
                        innerRadius: 85,
                        outerRadius: 130,
                        paddingAngle: 4,
                        cornerRadius: 12,
                        highlightScope: { fade: "global", highlight: "item" },
                        cx: "50%",
                        cy: "45%",
                      },
                    ]}
                    height={400}
                    slotProps={{
                      legend: {
                        direction: "row",
                        position: { vertical: "bottom", horizontal: "middle" },
                        itemMarkWidth: 10,
                        itemMarkHeight: 10,
                        markGap: 6,
                        itemGap: 15,
                        labelStyle: { fontSize: 11, fontWeight: 600 },
                        padding: { top: 10 },
                      } as any,
                    }}
                  />
                  <Box
                    sx={{
                      position: "absolute",
                      top: "45%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      textAlign: "center",
                      pointerEvents: "none",
                      display: { xs: "none", sm: "block" },
                    }}
                  >
                    <Typography variant="h3" sx={{ fontWeight: 950, color: theme.palette.text.primary, mb: -0.5, letterSpacing: -1.5 }}>
                      {summary?.totalQuotes}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary", fontWeight: 800, textTransform: "uppercase", letterSpacing: 2, fontSize: "0.7rem", opacity: 0.8 }}
                    >
                      PROYECTOS
                    </Typography>
                  </Box>
                </>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: "100%",
                    bgcolor: alpha(theme.palette.action.disabledBackground, 0.02),
                    borderRadius: 5,
                  }}
                >
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Sin datos de materiales
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 7,
              border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              height: "100%",
              background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${theme.palette.background.paper} 100%)`,
              boxShadow: "0 20px 40px -15px rgba(0,0,0,0.05)",
              overflow: "hidden",
            }}
          >
            <Typography variant="h6" sx={{ mb: 4, fontWeight: 900, fontSize: "1.3rem", letterSpacing: -0.5, display: "flex", alignItems: "center", gap: 1 }}>
              Geometría de Proyectos
              <Tooltip title="Distribución de las formas (L, U, Recto) seleccionadas por los clientes. Permite entender la complejidad física de los pedidos habituales.">
                <InfoOutlinedIcon sx={{ fontSize: 18, color: "text.secondary", opacity: 0.5, cursor: "help" }} />
              </Tooltip>
            </Typography>
            <Box sx={{ height: 420, display: "flex", justifyContent: "center", position: "relative" }}>
              {loading ? (
                <Skeleton variant="circular" height={280} width={280} sx={{ mx: "auto" }} />
              ) : shapesData.length > 0 ? (
                <PieChart
                  series={[
                    {
                      data: shapesData,
                      innerRadius: 40,
                      outerRadius: 130,
                      paddingAngle: 2,
                      cornerRadius: 8,
                      highlightScope: { fade: "global", highlight: "item" },
                      cx: "50%",
                      cy: "45%",
                    },
                  ]}
                  height={400}
                  slotProps={{
                    legend: {
                      direction: "row",
                      position: { vertical: "bottom", horizontal: "middle" },
                      itemMarkWidth: 10,
                      itemMarkHeight: 10,
                      markGap: 6,
                      itemGap: 15,
                      labelStyle: { fontSize: 11, fontWeight: 600 },
                      padding: { top: 10 },
                    } as any,
                  }}
                />
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: "100%",
                    bgcolor: alpha(theme.palette.action.disabledBackground, 0.02),
                    borderRadius: 5,
                  }}
                >
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    Sin datos de formas
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Bottom Row: Addons Demand Chart */}
        <Grid size={{ xs: 12 }}>
          <Paper
            elevation={0}
            sx={{
              p: 5,
              borderRadius: 7,
              border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              background: `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${theme.palette.background.paper} 100%)`,
              boxShadow: "0 25px 50px -20px rgba(0,0,0,0.06)",
            }}
          >
            <Typography variant="h6" sx={{ mb: 5, fontWeight: 950, fontSize: "1.5rem", letterSpacing: -0.8, display: "flex", alignItems: "center", gap: 1.5 }}>
              Ranking de Mecanizados y Accesorios
              <Tooltip title="Muestra los extras (fregaderos, taladros, encastres, etc.) más frecuentes para identificar tendencias en el equipamiento de cocinas.">
                <InfoOutlinedIcon sx={{ fontSize: 20, color: "text.secondary", opacity: 0.5, cursor: "help" }} />
              </Tooltip>
            </Typography>
            <Box sx={{ height: 450 }}>
              {loading ? (
                <Stack spacing={3} sx={{ mt: 2 }}>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Skeleton variant="text" width={180} height={32} sx={{ borderRadius: 1 }} />
                      <Skeleton variant="rectangular" width={`${Math.max(40, 100 - i * 10)}%`} height={36} sx={{ borderRadius: 2 }} />
                    </Box>
                  ))}
                </Stack>
              ) : addonsData.length > 0 ? (
                <BarChart
                  dataset={addonsData}
                  yAxis={[
                    {
                      scaleType: "band",
                      dataKey: "label",
                    },
                  ]}
                  series={[
                    {
                      dataKey: "count",
                      label: "Frecuencia de Uso",
                      color: theme.palette.primary.main,
                      valueFormatter: (v: number | null) => `${v ?? 0} unidades`,
                    },
                  ]}
                  layout="horizontal"
                  height={450}
                  margin={{ left: 200, right: 60, top: 40, bottom: 50 }}
                  borderRadius={10}
                  slotProps={{
                    legend: {
                      direction: "horizontal",
                      position: { vertical: "top", horizontal: "middle" },
                      padding: 0,
                    } as any,
                  }}
                  sx={{
                    "& .MuiChartsAxis-left .MuiChartsAxis-tickLabel": {
                      fontSize: 13,
                      fontWeight: 700,
                      fill: theme.palette.text.secondary,
                    },
                    "& .MuiBarElement-root": {
                      fill: `url(#barGradient)`,
                    },
                  }}
                >
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={theme.palette.primary.main} />
                      <stop offset="100%" stopColor={theme.palette.primary.light} />
                    </linearGradient>
                  </defs>
                </BarChart>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: 300,
                    bgcolor: alpha(theme.palette.action.disabledBackground, 0.02),
                    borderRadius: 5,
                    border: `2px dashed ${theme.palette.divider}`,
                  }}
                >
                  <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                    No se encontraron registros de mecanizados
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
