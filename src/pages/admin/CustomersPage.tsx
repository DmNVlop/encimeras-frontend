import React, { useState, useEffect, useCallback } from "react";
import { Box, Typography, Stack, Button, TextField, InputAdornment, useTheme, alpha, Paper } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";

import AdminPageTitle from "./components/AdminPageTitle";
import CustomerList from "./customers/CustomerList";
import CustomerDrawer from "./customers/CustomerDrawer";
import { type ICustomer } from "@/interfases/customer.interfase";
import { getCustomers } from "@/services/customer.service";

const CustomersPage: React.FC = () => {
  const theme = useTheme();
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<ICustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(null);
  const [isNew, setIsNew] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error("Error loading customers:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const term = search.toLowerCase();
    const filtered = customers.filter(
      (c) =>
        c.officialName.toLowerCase().includes(term) ||
        (c.nif && c.nif.toLowerCase().includes(term)) ||
        (c.contact?.email && c.contact.email.toLowerCase().includes(term)),
    );
    setFilteredCustomers(filtered);
  }, [search, customers]);

  const handleCreateNew = () => {
    setSelectedCustomer(null);
    setIsNew(true);
    setDrawerOpen(true);
  };

  const handleCustomerClick = (customer: ICustomer) => {
    setSelectedCustomer(customer);
    setIsNew(false);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedCustomer(null);
    setIsNew(false);
  };

  return (
    <Box sx={{ pb: 8 }}>
      {/* Header Section */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "flex-end" }} sx={{ mb: 5 }} spacing={3}>
        <Box>
          <AdminPageTitle>Directorio de Clientes</AdminPageTitle>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1, opacity: 0.8 }}>
            Gestiona empresas y particulares activos.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateNew}
          sx={{
            borderRadius: 3,
            fontWeight: 800,
            px: 4,
            py: 1.5,
            backgroundColor: "#222", // As per screenshot dark button
            "&:hover": { backgroundColor: "#000" },
            boxShadow: `0 8px 16px -4px ${alpha(theme.palette.common.black, 0.3)}`,
            textTransform: "none",
            fontSize: "1rem",
          }}
        >
          Nuevo Cliente
        </Button>
      </Stack>

      {/* Filter Bar */}
      <Box sx={{ mb: 4, maxWidth: 500 }}>
        <TextField
          fullWidth
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "text.secondary", opacity: 0.5 }} />
              </InputAdornment>
            ),
            sx: {
              borderRadius: "12px",
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              "& .MuiOutlinedInput-notchedOutline": { border: "none" },
            },
          }}
        />
      </Box>

      {/* Main List Container */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 6,
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          background: alpha(theme.palette.background.paper, 0.3),
          backdropFilter: "blur(20px)",
        }}
      >
        <CustomerList customers={filteredCustomers} loading={loading} onCustomerClick={handleCustomerClick} />
      </Paper>

      {/* Details Drawer */}
      <CustomerDrawer open={drawerOpen} customer={selectedCustomer} isNew={isNew} onClose={handleCloseDrawer} onRefresh={fetchData} />
    </Box>
  );
};

export default CustomersPage;
