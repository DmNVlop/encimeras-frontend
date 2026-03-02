import React from "react";
import { Box, Typography, Paper, Stack, Tooltip, IconButton, Skeleton, alpha, useTheme } from "@mui/material";
import { LineChart } from "@mui/x-charts";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

interface TrendsChartProps {
  data: any[];
  loading: boolean;
}

export const TrendsChart: React.FC<TrendsChartProps> = ({ data, loading }) => {
  const theme = useTheme();

  return (
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
        ) : data.length > 0 ? (
          <LineChart
            xAxis={[
              {
                data: data.map((d) => new Date(d.date)),
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
                data: data.map((d) => d.count),
                label: "Presupuestos",
                area: true,
                curve: "catmullRom",
                color: alpha(theme.palette.primary.main, 0.6),
              },
              {
                data: data.map((d) => d.points),
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
  );
};
