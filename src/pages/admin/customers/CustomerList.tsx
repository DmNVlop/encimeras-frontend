import React from "react";
import { Box, Typography, Stack, Skeleton } from "@mui/material";
import CustomerItem from "./CustomerItem";
import { type ICustomer } from "@/interfases/customer.interfase";

interface CustomerListProps {
  customers: ICustomer[];
  loading: boolean;
  onCustomerClick: (customer: ICustomer) => void;
}

const CustomerList: React.FC<CustomerListProps> = ({ customers, loading, onCustomerClick }) => {
  const handleActionClick = (e: React.MouseEvent, customer: ICustomer) => {
    e.stopPropagation();
    // For now, same as click, or open a menu
    onCustomerClick(customer);
  };

  if (loading) {
    return (
      <Stack spacing={2}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} variant="rectangular" height={90} sx={{ borderRadius: 4, opacity: 0.1 }} />
        ))}
      </Stack>
    );
  }

  if (customers.length === 0) {
    return (
      <Box sx={{ py: 10, textAlign: "center" }}>
        <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
          No se encontraron clientes que coincidan con la búsqueda.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      {/* List Header Labels (Optional but good for desktop) */}
      <Box sx={{ px: 2.5, mb: 1, display: { xs: "none", md: "flex" }, alignItems: "center", opacity: 0.5 }}>
        <Typography variant="overline" sx={{ flex: 2, fontWeight: 800 }}>
          CLIENTE
        </Typography>
        <Typography variant="overline" sx={{ flex: 1, textAlign: "center", fontWeight: 800 }}>
          TIPO
        </Typography>
        <Typography variant="overline" sx={{ flex: 2, fontWeight: 800 }}>
          CONTACTO
        </Typography>
        <Box sx={{ width: 40 }} />
      </Box>

      {customers.map((customer) => (
        <CustomerItem key={customer._id} customer={customer} onClick={onCustomerClick} onActionClick={handleActionClick} />
      ))}
    </Box>
  );
};

export default CustomerList;
