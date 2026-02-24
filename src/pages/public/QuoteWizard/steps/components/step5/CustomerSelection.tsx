import React from "react";
import { Paper, Typography, Grid, Autocomplete, Avatar, Box, Divider, TextField, CircularProgress, alpha, useTheme, createFilterOptions } from "@mui/material";
import Person from "@mui/icons-material/Person";
import SearchIcon from "@mui/icons-material/Search";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import type { ICustomer } from "@/interfases/customer.interfase";

interface CustomerSelectionProps {
  customers: ICustomer[];
  selectedCustomer: ICustomer | null;
  loadingCustomers: boolean;
  onCustomerChange: (customer: ICustomer | null) => void;
}

export const CustomerSelection: React.FC<CustomerSelectionProps> = ({ customers, selectedCustomer, loadingCustomers, onCustomerChange }) => {
  const theme = useTheme();

  // Filtro avanzado para el buscador de clientes
  const filterOptions = createFilterOptions({
    matchFrom: "any",
    stringify: (option: ICustomer) => `${option.officialName} ${option.commercialName || ""} ${option.nif || ""} ${option.contact?.email || ""}`,
  });

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 4,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: alpha(theme.palette.primary.main, 0.02),
      }}
    >
      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
        <Person color="primary" sx={{ fontSize: 20 }} /> Asignar Cliente (Obligatorio para enviar)
      </Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid size={{ xs: 12, sm: 8 }}>
          <Autocomplete
            options={customers}
            loading={loadingCustomers}
            filterOptions={filterOptions}
            getOptionLabel={(option: ICustomer) => option.officialName}
            value={selectedCustomer}
            onChange={(_: any, newValue: ICustomer | null) => onCustomerChange(newValue)}
            renderOption={(props, option: ICustomer) => {
              const { key, ...optionProps } = props as any;
              return (
                <Box component="li" key={option._id} {...optionProps} sx={{ py: 1, px: 2, borderBottom: "1px solid", borderColor: "grey.100" }}>
                  <Grid container alignItems="center" spacing={1}>
                    <Grid size={{ xs: "auto" }} sx={{ display: "flex", width: 40 }}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: "primary.main",
                          fontSize: "0.85rem",
                        }}
                      >
                        {option.officialName.charAt(0).toUpperCase()}
                      </Avatar>
                    </Grid>
                    <Grid sx={{ flex: 1, minWidth: 0, wordWrap: "break-word" }}>
                      <Typography variant="body2" fontWeight="bold">
                        {option.officialName}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                        <Typography variant="caption" color="text.secondary">
                          NIF: {option.nif || "---"}
                        </Typography>
                        {option.commercialName && (
                          <>
                            <Divider orientation="vertical" flexItem sx={{ height: 12, my: "auto" }} />
                            <Typography variant="caption" color="text.secondary">
                              {option.commercialName}
                            </Typography>
                          </>
                        )}
                      </Box>
                      {option.contact?.email && (
                        <Typography variant="caption" color="primary" sx={{ display: "block", fontSize: "0.7rem" }}>
                          {option.contact.email}
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                </Box>
              );
            }}
            renderInput={(params: any) => (
              <TextField
                {...params}
                label="Buscar Cliente"
                placeholder="Escribe nombre, NIF o email..."
                size="small"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <SearchIcon color="action" sx={{ ml: 1, mr: -0.5, fontSize: 20 }} />
                      {params.InputProps.startAdornment}
                    </>
                  ),
                  endAdornment: (
                    <>
                      {loadingCustomers ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary" }}>
            <InfoOutlinedIcon fontSize="small" />
            <Typography variant="caption">Al cambiar el cliente, debes pulsar "Calcular Presupuesto".</Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};
