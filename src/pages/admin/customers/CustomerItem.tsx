import React, { useState } from "react";
import { Box, Typography, Stack, Chip, IconButton, useTheme, alpha, Paper, Checkbox, Avatar, Tooltip, Menu, MenuItem as MuiMenuItem, ListItemIcon, ListItemText } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
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
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
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

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
  };

  const handleMenuClose = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setMenuAnchor(null);
  };

  const handleOpenDrawer = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuAnchor(null);
    onOpenDrawer(customer);
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
        userSelect: "none",
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
              <Tooltip
                key={user._id}
                title={[user.name, user.username, user.email].filter(Boolean).join(" · ")}
                placement="top"
              >
                <Avatar
                  sx={{
                    width: 28,
                    height: 28,
                    fontSize: "0.7rem",
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
                      width: 26,
                      height: 26,
                      fontSize: "0.65rem",
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
          <IconButton
            size="small"
            onClick={handleMenuOpen}
            sx={{
              color: "text.secondary",
              transition: "all 0.2s",
              "&:hover": { backgroundColor: alpha(theme.palette.primary.main, 0.05), color: theme.palette.primary.main },
            }}
          >
            <MoreVertIcon />
          </IconButton>
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={handleMenuClose}
            onClick={(e) => e.stopPropagation()}
            slotProps={{
              paper: {
                elevation: 4,
                sx: {
                  borderRadius: 3,
                  minWidth: 180,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  backdropFilter: "blur(20px)",
                  background: alpha(theme.palette.background.paper, 0.95),
                  overflow: "visible",
                  mt: 0.5,
                },
              },
            }}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          >
            <MuiMenuItem onClick={handleOpenDrawer} sx={{ borderRadius: 2, mx: 0.5, my: 0.25 }}>
              <ListItemIcon>
                <OpenInFullIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Ver / Editar" primaryTypographyProps={{ fontWeight: 700, fontSize: "0.9rem" }} />
            </MuiMenuItem>
          </Menu>
        </Box>
      </Box>
    </Paper>
  );
};

export default CustomerItem;
