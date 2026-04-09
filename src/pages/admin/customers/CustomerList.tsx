import React from "react";
import { Box, Typography, Stack, Skeleton, Checkbox, useTheme, alpha } from "@mui/material";
import CustomerItem from "./CustomerItem";
import { type ICustomer } from "@/interfases/customer.interfase";
import type { User } from "@/interfases/user.interfase";

interface CustomerListProps {
  customers: ICustomer[];
  loading: boolean;
  selectedIds: Set<string>;
  salesUsers: User[];
  onCustomerClick: (customer: ICustomer) => void;
  onSelect: (customer: ICustomer, selected: boolean) => void;
  onSelectAll: (selectAll: boolean, visibleOnly: boolean) => void;
}

const CustomerList: React.FC<CustomerListProps> = ({ customers, loading, selectedIds, salesUsers, onCustomerClick, onSelect, onSelectAll }) => {
  const theme = useTheme();

  const handleActionClick = (e: React.MouseEvent, customer: ICustomer) => {
    e.stopPropagation();
    onCustomerClick(customer);
  };

  const allVisibleSelected = customers.length > 0 && customers.every((c) => selectedIds.has(c._id || ""));
  const someSelected = customers.some((c) => selectedIds.has(c._id || ""));

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
      {/* List Header with Selection */}
      <Box
        sx={{
          px: 2.5,
          py: 1.5,
          mb: 1,
          display: "flex",
          alignItems: "center",
          borderRadius: 3,
          backgroundColor: alpha(theme.palette.background.paper, 0.5),
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        }}
      >
        <Checkbox
          indeterminate={someSelected && !allVisibleSelected}
          checked={allVisibleSelected}
          onChange={(e) => onSelectAll(e.target.checked, true)}
          sx={{
            mr: 1,
            color: alpha(theme.palette.text.secondary, 0.3),
            "&.Mui-checked": {
              color: theme.palette.primary.main,
            },
          }}
        />
        <Typography variant="overline" sx={{ flex: 2, fontWeight: 800, opacity: 0.5 }}>
          CLIENTE
        </Typography>
        <Typography variant="overline" sx={{ flex: 1, textAlign: "center", fontWeight: 800, opacity: 0.5 }}>
          TIPO
        </Typography>
        <Typography variant="overline" sx={{ flex: 2, fontWeight: 800, opacity: 0.5 }}>
          CONTACTO
        </Typography>
        <Typography variant="overline" sx={{ flex: 1.5, textAlign: "center", fontWeight: 800, opacity: 0.5 }}>
          ASIGNADO
        </Typography>
        <Box sx={{ width: 40 }} />
      </Box>

      {customers.map((customer) => (
        <CustomerItem
          key={customer._id}
          customer={customer}
          selected={selectedIds.has(customer._id || "")}
          salesUsers={salesUsers}
          onClick={onCustomerClick}
          onSelect={onSelect}
          onActionClick={handleActionClick}
        />
      ))}
    </Box>
  );
};

export default CustomerList;
