import React from "react";
import {
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Stack,
  Button,
  Tooltip,
  IconButton,
  alpha,
  useTheme,
} from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import FilterListIcon from "@mui/icons-material/FilterList";
import RefreshIcon from "@mui/icons-material/Refresh";
import type { AnalyticsFilters } from "@/services/analytics.service";

interface DashboardFiltersProps {
  filters: AnalyticsFilters;
  loading: boolean;
  onFilterChange: (field: keyof AnalyticsFilters, value: any) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({ filters, loading, onFilterChange, onApplyFilters, onResetFilters }) => {
  const theme = useTheme();

  return (
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
              onChange={(e) => onFilterChange("status", e.target.value)}
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
            onChange={(e) => onFilterChange("startDate", e.target.value)}
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
            onChange={(e) => onFilterChange("endDate", e.target.value)}
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
              onClick={onApplyFilters}
              disabled={loading}
              sx={{
                borderRadius: 3,
                fontWeight: 700,
                py: 1.2,
                boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
              }}
            >
              Actualizar
            </Button>
            <Tooltip title="Restablecer filtros">
              <IconButton
                onClick={onResetFilters}
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
  );
};
