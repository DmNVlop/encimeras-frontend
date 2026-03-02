import React from "react";
import { Box, Card, CardContent, Typography, Skeleton, useTheme, Stack, Tooltip, alpha } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactElement;
  loading: boolean;
  color?: string;
  info?: string;
}

/**
 * KPI Card Component with Glassmorphism and Premium feel
 */
export const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, loading, color, info }) => {
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
          boxShadow: `0 24px 48px -12px ${alpha(
            color || theme.palette.common.black,
            0.2,
          )}, 0 12px 24px -12px ${alpha(color || theme.palette.common.black, 0.08)}`,
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
                sx={{
                  fontWeight: 800,
                  letterSpacing: 1.5,
                  display: "block",
                  opacity: 0.7,
                  textTransform: "uppercase",
                  fontSize: "0.7rem",
                }}
              >
                {title}
              </Typography>
              {info && (
                <Tooltip title={info} arrow placement="top">
                  <InfoOutlinedIcon
                    sx={{
                      fontSize: 16,
                      color: "text.secondary",
                      opacity: 0.4,
                      cursor: "help",
                    }}
                  />
                </Tooltip>
              )}
            </Stack>
            {loading ? (
              <Skeleton width="80%" height={56} sx={{ my: 0.5, borderRadius: 2 }} />
            ) : (
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 900,
                  fontSize: "2.2rem",
                  color: color,
                  letterSpacing: "-0.03em",
                  mb: 0.5,
                }}
              >
                {value}
              </Typography>
            )}
            {subtitle && !loading && (
              <Typography
                variant="caption"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mt: 1.5,
                  fontWeight: 600,
                  color: "text.secondary",
                  opacity: 0.8,
                }}
              >
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
              background: `linear-gradient(135deg, ${alpha(
                color || theme.palette.primary.main,
                0.2,
              )} 0%, ${alpha(color || theme.palette.primary.main, 0.05)} 100%)`,
              color: color || theme.palette.primary.main,
              boxShadow: `0 8px 20px -6px ${alpha(color || theme.palette.primary.main, 0.2)}`,
              transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {React.cloneElement(icon as React.ReactElement<any>, { sx: { fontSize: 32 } })}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};
