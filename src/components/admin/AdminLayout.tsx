// src/components/admin/AdminLayout.tsx
import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  Divider,
} from "@mui/material";
import PriceCheckIcon from "@mui/icons-material/PriceCheck";
import SettingsIcon from "@mui/icons-material/Tune";
import StoneIcon from "@mui/icons-material/SquareFoot";
import LogoutIcon from "@mui/icons-material/Logout";

import DashboardIcon from "@mui/icons-material/Dashboard";
import logo from "@/assets/logos/kuuk-logo.png";
import { useAuth } from "@/context/AuthProvider";

const drawerWidth = 240;

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    setAnchorEl(null);
    navigate("/login");
  };

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/admin/dashboard" },
    { text: "Atributos", path: "/admin/attributes", icon: <SettingsIcon /> },
    { text: "Materiales", icon: <StoneIcon />, path: "/admin/materials" },
    { text: "Reglas Medidas", icon: <StoneIcon />, path: "/admin/rule-sets" },
    { text: "Complementos", icon: <StoneIcon />, path: "/admin/addons" },
    { text: "Precios", icon: <PriceCheckIcon />, path: "/admin/price-configs" },
    { text: "-------------------", icon: "", path: "#" },
    { text: "Órdenes", icon: <PriceCheckIcon />, path: "/admin/orders" },
  ];

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              component="img"
              src={logo}
              alt="Kuuk Logo"
              sx={{
                maxHeight: 50, // Slightly smaller for Admin potentially, or same as User (60)
                width: "auto",
                objectFit: "contain",
                display: "block",
                filter: "brightness(0) invert(1)", // To make logo white on primary dark background if needed
              }}
            />
            <Typography
              variant="h6"
              noWrap
              sx={{
                fontWeight: 500,
                fontSize: "1.1rem",
                borderLeft: "1px solid",
                borderColor: "rgba(255, 255, 255, 0.3)", // Lighter border for dark background
                pl: 2,
                display: { xs: "none", sm: "block" },
              }}
            >
              Panel de Administración
            </Typography>
          </Box>

          {/* User Menu */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" sx={{ display: { xs: "none", sm: "block" }, textAlign: "right" }}>
              <Box component="span" sx={{ display: "block", fontWeight: "bold" }}>
                {user?.name || "Administrador"}
              </Box>
              <Box component="span" sx={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "0.75rem" }}>
                {user?.roles?.[0] || "Admin"}
              </Box>
            </Typography>
            <IconButton size="large" aria-label="account of current user" aria-controls="menu-appbar" aria-haspopup="true" onClick={handleMenu} color="inherit">
              <Avatar sx={{ bgcolor: "primary.light", width: 32, height: 32, fontSize: "0.875rem" }}>
                {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
              </Avatar>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem
                onClick={() => {
                  handleClose();
                  navigate("/user-profile");
                }}
              >
                Perfil
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Cerrar Sesión
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: "border-box" },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: "auto" }}>
          <List>
            {menuItems.map((item) => (
              // 3. Usamos ListItem como contenedor y ListItemButton para la interacción
              <ListItem key={item.text} disablePadding>
                <ListItemButton component={NavLink} to={item.path}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default AdminLayout;
