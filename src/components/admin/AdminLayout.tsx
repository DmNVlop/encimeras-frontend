import React, { useCallback, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import { AppBar, Toolbar, Typography, Box, Avatar, Menu, MenuItem, IconButton, Divider, ListItemIcon } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import CalculateIcon from "@mui/icons-material/Calculate";
import { useAuth } from "@/context/AuthProvider";
import { useFactorySettings } from "@/context/FactorySettingsContext";
import { VersionBadge } from "@/components/common/VersionBadge";

import AdminSidebar from "./components/AdminSidebar";

const DEFAULT_LOGO = "/logos/kuuk-logo.png";
const drawerWidth = 260;

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { logoUrl } = useFactorySettings();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

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

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" aria-label="Abrir menú" onClick={() => setMobileNavOpen(true)} sx={{ mr: 1, display: { md: "none" } }}>
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              component="img"
              src={logoUrl ?? DEFAULT_LOGO}
              alt="Logo"
              sx={{
                maxHeight: 50,
                width: "auto",
                objectFit: "contain",
                display: "block",
                filter: logoUrl ? "none" : "brightness(0) invert(1)",
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

          <VersionBadge />

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
              <MenuItem
                onClick={() => {
                  handleClose();
                  navigate("/dashboard");
                }}
                sx={{ color: "primary.main", fontWeight: "bold" }}
              >
                <ListItemIcon>
                  <CalculateIcon fontSize="small" color="primary" />
                </ListItemIcon>
                Presupuestador
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
      <AdminSidebar drawerWidth={drawerWidth} mobileOpen={mobileNavOpen} onMobileClose={closeMobileNav} />
      {/* minWidth 0: sin él, una DataGrid ancha estira el flex item y la página entera hace scroll horizontal */}
      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, p: { xs: 1.5, md: 3 } }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default AdminLayout;
