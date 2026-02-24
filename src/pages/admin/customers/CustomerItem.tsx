import React from "react";
import { Box, Typography, Stack, Chip, IconButton, useTheme, alpha, Paper } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import { type ICustomer, CustomerType } from "@/interfases/customer.interfase";

interface CustomerItemProps {
  customer: ICustomer;
  onClick: (customer: ICustomer) => void;
  onActionClick: (e: React.MouseEvent, customer: ICustomer) => void;
}

const CustomerItem: React.FC<CustomerItemProps> = ({ customer, onClick, onActionClick }) => {
  const theme = useTheme();
  const isCompany = customer.type === CustomerType.COMPANY;

  return (
    <Paper
      elevation={0}
      onClick={() => onClick(customer)}
      sx={{
        p: 2.5,
        mb: 1.5,
        borderRadius: 4,
        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        background: alpha(theme.palette.background.paper, 0.5),
        backdropFilter: "blur(10px)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: `0 12px 24px -10px ${alpha(theme.palette.common.black, 0.1)}`,
          borderColor: alpha(theme.palette.primary.main, 0.2),
          background: theme.palette.background.paper,
        },
      }}
    >
      <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center" }}>
        {/* Info Column */}
        <Box sx={{ flex: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "text.primary" }}>
            {customer.officialName}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, opacity: 0.7 }}>
            {customer.nif || "Sin NIF"}
          </Typography>
        </Box>

        {/* Type Column */}
        <Box sx={{ flex: 1, textAlign: "center" }}>
          <Chip
            icon={isCompany ? <BusinessIcon sx={{ fontSize: "1rem !important" }} /> : <PersonIcon sx={{ fontSize: "1rem !important" }} />}
            label={isCompany ? "Empresa" : "Particular"}
            size="small"
            sx={{
              fontWeight: 700,
              fontSize: "0.75rem",
              borderRadius: "8px",
              backgroundColor: isCompany ? alpha(theme.palette.primary.main, 0.1) : alpha(theme.palette.success.main, 0.1),
              color: isCompany ? theme.palette.primary.main : theme.palette.success.main,
              border: `1px solid ${isCompany ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.success.main, 0.2)}`,
            }}
          />
        </Box>

        {/* Contact Column */}
        <Box sx={{ flex: 2 }}>
          <Stack spacing={0.5}>
            {customer.contact.email && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <EmailIcon sx={{ fontSize: 14, color: "text.secondary", opacity: 0.5 }} />
                <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500, fontSize: "0.85rem" }}>
                  {customer.contact.email}
                </Typography>
              </Box>
            )}
            {customer.contact.phone && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <PhoneIcon sx={{ fontSize: 14, color: "text.secondary", opacity: 0.5 }} />
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, opacity: 0.6 }}>
                  {customer.contact.phone}
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>

        {/* Actions */}
        <Box>
          <IconButton
            size="small"
            onClick={(e) => onActionClick(e, customer)}
            sx={{
              color: "text.secondary",
              transition: "all 0.2s",
              "&:hover": { backgroundColor: alpha(theme.palette.primary.main, 0.05), color: theme.palette.primary.main },
            }}
          >
            <MoreVertIcon />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
};

export default CustomerItem;
