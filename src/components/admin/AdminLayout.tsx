// src/components/admin/AdminLayout.tsx
import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { AppBar, Toolbar, Typography, Button, Box, Drawer, List, ListItem, ListItemText, ListItemIcon, ListItemButton } from "@mui/material";
import PriceCheckIcon from "@mui/icons-material/PriceCheck";
import SettingsIcon from "@mui/icons-material/Tune";
import StoneIcon from "@mui/icons-material/SquareFoot";
// import CarpenterIcon from "@mui/icons-material/Carpenter";
// import EdgesensorLowIcon from "@mui/icons-material/EdgesensorLow";

import { logout } from "../../services/authService";
import DashboardIcon from "@mui/icons-material/Dashboard";

const drawerWidth = 240;

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/admin/dashboard" },
    { text: "Configuraciones", path: "/admin/attributes", icon: <SettingsIcon /> },
    { text: "Materiales", icon: <StoneIcon />, path: "/admin/materials" },
    { text: "Reglas Medidas", icon: <StoneIcon />, path: "/admin/rule-sets" },
    { text: "Complementos", icon: <StoneIcon />, path: "/admin/addons" },
    // { text: "Ensambles", icon: <EdgesensorLowIcon />, path: "/admin/edges" },
    // { text: "Trabajos CyC", icon: <CarpenterIcon />, path: "/admin/cutouts" },
    { text: "Precios", icon: <PriceCheckIcon />, path: "/admin/price-configs" },
    // Añadir más items aquí (Cantos, Cortes, etc.)
  ];

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Panel de Administración
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Cerrar Sesión
          </Button>
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
