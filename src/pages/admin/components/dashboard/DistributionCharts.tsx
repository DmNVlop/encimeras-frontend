import React from "react";
import { Box, Typography, Paper, Grid, Tooltip, Skeleton, alpha, useTheme } from "@mui/material";
import { PieChart } from "@mui/x-charts";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

interface DistributionChartsProps {
  materialsData: any[];
  shapesData: any[];
  totalQuotes: number | undefined;
  loading: boolean;
}

export const DistributionCharts: React.FC<DistributionChartsProps> = ({ materialsData, shapesData, totalQuotes, loading }) => {
  const theme = useTheme();

  return (
    <Grid container spacing={4}>
      {/* Materials Distribution */}
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
          <Typography
            variant="h6"
            sx={{
              mb: 4,
              fontWeight: 900,
              fontSize: "1.3rem",
              letterSpacing: -0.5,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            Distribución de Materiales
            <Tooltip title="Análisis de los materiales más solicitados. El porcentaje representa la 'cuota de mercado' interna dentro de la fábrica.">
              <InfoOutlinedIcon sx={{ fontSize: 18, color: "text.secondary", opacity: 0.5, cursor: "help" }} />
            </Tooltip>
          </Typography>
          <Box
            sx={{
              height: 420,
              display: "flex",
              justifyContent: "center",
              position: "relative",
            }}
          >
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
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 950,
                      color: theme.palette.text.primary,
                      mb: -0.5,
                      letterSpacing: -1.5,
                    }}
                  >
                    {totalQuotes}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: 2,
                      fontSize: "0.7rem",
                      opacity: 0.8,
                    }}
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

      {/* Shapes Distribution */}
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
          <Typography
            variant="h6"
            sx={{
              mb: 4,
              fontWeight: 900,
              fontSize: "1.3rem",
              letterSpacing: -0.5,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            Geometría de Proyectos
            <Tooltip title="Distribución de las formas (L, U, Recto) seleccionadas por los clientes. Permite entender la complejidad física de los pedidos habituales.">
              <InfoOutlinedIcon sx={{ fontSize: 18, color: "text.secondary", opacity: 0.5, cursor: "help" }} />
            </Tooltip>
          </Typography>
          <Box
            sx={{
              height: 420,
              display: "flex",
              justifyContent: "center",
              position: "relative",
            }}
          >
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
    </Grid>
  );
};
