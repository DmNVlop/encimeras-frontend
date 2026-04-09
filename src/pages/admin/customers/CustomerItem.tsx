import React from "react";
import { Box, Typography, Stack, Chip, IconButton, useTheme, alpha, Paper, Checkbox, Avatar } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import { type ICustomer, CustomerType } from "@/interfases/customer.interfase";
import type { User } from "@/interfases/user.interfase";

interface CustomerItemProps {
  customer: ICustomer;
  selected: boolean;
  salesUsers: User[];
  onClick: (customer: ICustomer) => void;
  onSelect: (customer: ICustomer, selected: boolean) => void;
  onActionClick: (e: React.MouseEvent, customer: ICustomer) => void;
}

const CustomerItem: React.FC<CustomerItemProps> = ({ customer, selected, salesUsers, onClick, onSelect, onActionClick }) => {
  const theme = useTheme();
  const isCompany = customer.type === CustomerType.COMPANY;

  const assignedUsers = salesUsers.filter((u) => customer.assignedUserIds?.includes(u._id));

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(customer, !selected);
  };

  const handleRowClick = () => {
    onClick(customer);
  };

  return (
    <Paper
      elevation={0}
      onClick={handleRowClick}
      sx={{
        p: 2.5,
        mb: 1.5,
        borderRadius: 4,
        border: `1px solid ${selected ? alpha(theme.palette.primary.main, 0.5) : alpha(theme.palette.divider, 0.08)}`,
        background: selected ? alpha(theme.palette.primary.main, 0.04) : alpha(theme.palette.background.paper, 0.5),
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
      <Box sx={{ display: "flex", alignItems: "center", mr: 2 }}>
        <Checkbox
          checked={selected}
          onClick={handleCheckboxClick}
          sx={{
            color: alpha(theme.palette.text.secondary, 0.3),
            "&.Mui-checked": {
              color: theme.palette.primary.main,
            },
            "&:hover": {
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
            },
          }}
        />
      </Box>
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

        {/* Assigned Sales Column */}
        <Box sx={{ flex: 1.5, display: "flex", justifyContent: "center", gap: 0.5, flexWrap: "wrap" }}>
          {assignedUsers.length > 0 ? (
            assignedUsers.slice(0, 3).map((user) => (
              <Avatar
                key={user._id}
                sx={{
                  width: 28,
                  height: 28,
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  backgroundColor: alpha(theme.palette.warning.main, 0.15),
                  color: theme.palette.warning.dark,
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                }}
              >
                {(user.name || user.username).charAt(0).toUpperCase()}
              </Avatar>
            ))
          ) : (
            <Typography variant="caption" sx={{ color: "text.secondary", opacity: 0.4, fontStyle: "italic" }}>
              Sin asignar
            </Typography>
          )}
          {assignedUsers.length > 3 && (
            <Chip
              label={`+${assignedUsers.length - 3}`}
              size="small"
              sx={{
                height: 20,
                fontSize: "0.65rem",
                fontWeight: 700,
                backgroundColor: alpha(theme.palette.warning.main, 0.1),
                color: theme.palette.warning.dark,
              }}
            />
          )}
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
