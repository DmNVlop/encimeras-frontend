import React from "react";
import { Box, Typography, Stack, Chip, IconButton, useTheme, alpha, Paper, Checkbox, Avatar, Tooltip } from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import { type ICustomer, CustomerType } from "@/interfases/customer.interfase";
import type { User } from "@/interfases/user.interfase";

interface CustomerItemProps {
  customer: ICustomer;
  selected: boolean;
  salesUsers: User[];
  showAuthor?: boolean;
  onClick: (customer: ICustomer, event: React.MouseEvent) => void;
  onSelect: (customer: ICustomer, selected: boolean) => void;
  onOpenDrawer: (customer: ICustomer) => void;
}

const CustomerItem: React.FC<CustomerItemProps> = ({ customer, selected, salesUsers, showAuthor = false, onClick, onSelect, onOpenDrawer }) => {
  const theme = useTheme();
  const isCompany = customer.type === CustomerType.COMPANY;

  const assignedUsers = salesUsers.filter((u) => customer.assignedUserIds?.includes(u._id));
  const creatorUser = showAuthor ? salesUsers.find((u) => u._id === customer.createdBy) : null;

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(customer, !selected);
  };

  const handleRowClick = (e: React.MouseEvent) => {
    onClick(customer, e);
  };

  const handleOpenDrawer = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenDrawer(customer);
  };

  return (
    <Paper
      elevation={0}
      onClick={handleRowClick}
      sx={{
        p: 0.75,
        mb: 0.5,
        borderRadius: 2.5,
        border: `1px solid ${selected ? alpha(theme.palette.primary.main, 0.5) : alpha(theme.palette.divider, 0.08)}`,
        background: selected ? alpha(theme.palette.primary.main, 0.04) : alpha(theme.palette.background.paper, 0.5),
        backdropFilter: "blur(10px)",
        transition: "border-color 0.2s, background-color 0.2s",
        cursor: "pointer",
        userSelect: "none",
        display: "flex",
        alignItems: "center",
        "&:hover": {
          borderColor: alpha(theme.palette.primary.main, 0.2),
          background: theme.palette.background.paper,
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", mr: 1 }}>
        <Checkbox
          size="small"
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
          <Typography variant="body2" sx={{ fontWeight: 800, color: "text.primary", lineHeight: 1.3 }}>
            {customer.officialName}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, opacity: 0.7, fontSize: "0.7rem", lineHeight: 1.2 }}>
            {customer.nif || "Sin NIF"}
          </Typography>
        </Box>

        {/* Type Column */}
        <Box sx={{ flex: 1, textAlign: "center" }}>
          <Chip
            icon={isCompany ? <BusinessIcon sx={{ fontSize: "0.9rem !important" }} /> : <PersonIcon sx={{ fontSize: "0.9rem !important" }} />}
            label={isCompany ? "Empresa" : "Particular"}
            size="small"
            sx={{
              height: 22,
              fontWeight: 700,
              fontSize: "0.7rem",
              borderRadius: "8px",
              backgroundColor: isCompany ? alpha(theme.palette.primary.main, 0.1) : alpha(theme.palette.success.main, 0.1),
              color: isCompany ? theme.palette.primary.main : theme.palette.success.main,
              border: `1px solid ${isCompany ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.success.main, 0.2)}`,
            }}
          />
        </Box>

        {/* Contact Column */}
        <Box sx={{ flex: 2 }}>
          <Stack spacing={0.1}>
            {customer.contact.email && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <EmailIcon sx={{ fontSize: 13, color: "text.secondary", opacity: 0.5 }} />
                <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500, fontSize: "0.78rem", lineHeight: 1.3 }}>
                  {customer.contact.email}
                </Typography>
              </Box>
            )}
            {customer.contact.phone && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <PhoneIcon sx={{ fontSize: 13, color: "text.secondary", opacity: 0.5 }} />
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, opacity: 0.6, fontSize: "0.7rem", lineHeight: 1.2 }}>
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
              <Tooltip
                key={user._id}
                title={[user.name, user.username, user.email].filter(Boolean).join(" · ")}
                placement="top"
              >
                <Avatar
                  sx={{
                    width: 22,
                    height: 22,
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    backgroundColor: alpha(theme.palette.warning.main, 0.15),
                    color: theme.palette.warning.dark,
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                    cursor: "default",
                  }}
                >
                  {(user.name || user.username).charAt(0).toUpperCase()}
                </Avatar>
              </Tooltip>
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

        {/* Author Column — only for ADMIN/WORKER */}
        {showAuthor && (
          <Box sx={{ flex: 1.5 }}>
            {creatorUser ? (
              <Tooltip title={`Creado por ${creatorUser.name || creatorUser.username}`} placement="top">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Avatar
                    sx={{
                      width: 22,
                      height: 22,
                      fontSize: "0.62rem",
                      fontWeight: 700,
                      backgroundColor: alpha(theme.palette.info.main, 0.12),
                      color: theme.palette.info.dark,
                      border: `1px solid ${alpha(theme.palette.info.main, 0.25)}`,
                    }}
                  >
                    {(creatorUser.name || creatorUser.username).charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.info.dark,
                      fontWeight: 600,
                      fontSize: "0.78rem",
                      opacity: 0.85,
                      maxWidth: 90,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {creatorUser.name || creatorUser.username}
                  </Typography>
                </Box>
              </Tooltip>
            ) : customer.createdBy ? (
              <Tooltip title="Usuario no encontrado en sales" placement="top">
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <DriveFileRenameOutlineIcon sx={{ fontSize: 14, color: "text.secondary", opacity: 0.4 }} />
                  <Typography variant="caption" sx={{ color: "text.secondary", opacity: 0.4, fontStyle: "italic" }}>
                    Sin nombre
                  </Typography>
                </Box>
              </Tooltip>
            ) : (
              <Typography variant="caption" sx={{ color: "text.secondary", opacity: 0.4, fontStyle: "italic" }}>
                —
              </Typography>
            )}
          </Box>
        )}

        {/* Actions */}
        <Box>
          <Tooltip title="Ver / Editar">
            <IconButton size="small" onClick={handleOpenDrawer}>
              <OpenInFullIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Paper>
  );
};

export default CustomerItem;
