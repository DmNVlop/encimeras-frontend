import React from "react";
import { Box, Typography, Paper, Stack, Tooltip, Skeleton, alpha, useTheme } from "@mui/material";
import { BarChart } from "@mui/x-charts";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

interface AddonsRankingChartProps {
  data: any[];
  loading: boolean;
}

export const AddonsRankingChart: React.FC<AddonsRankingChartProps> = ({ data, loading }) => {
  const theme = useTheme();

  return (
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
      <Typography
        variant="h6"
        sx={{
          mb: 5,
          fontWeight: 950,
          fontSize: "1.5rem",
          letterSpacing: -0.8,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
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
        ) : data.length > 0 ? (
          <BarChart
            dataset={data}
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
  );
};
