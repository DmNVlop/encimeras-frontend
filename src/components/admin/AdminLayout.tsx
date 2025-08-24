// src/components/admin/AdminLayout.tsx
import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { AppBar, Toolbar, Typography, Button, Box, Drawer, List, ListItem, ListItemText, ListItemIcon } from "@mui/material";
import { logout } from "../../services/authService";

import DashboardIcon from "@mui/icons-material/Dashboard";
import StoneIcon from "@mui/icons-material/SquareFoot";
import CarpenterIcon from "@mui/icons-material/Carpenter";
import EdgesensorLowIcon from "@mui/icons-material/EdgesensorLow";

const drawerWidth = 240;

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/admin/dashboard" },
    { text: "Materiales", icon: <StoneIcon />, path: "/admin/materials" },
    { text: "Cantos", icon: <EdgesensorLowIcon />, path: "/admin/edges" },
    { text: "Cortes", icon: <CarpenterIcon />, path: "/admin/cutouts" },
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
        }}>
        <Toolbar />
        <Box sx={{ overflow: "auto" }}>
          <List>
            {menuItems.map((item) => (
              <ListItem button key={item.text} onClick={() => navigate(item.path)}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {/* Aquí se renderizará el contenido de cada página (Dashboard, Materiales, etc.) */}
        <Outlet />
      </Box>
    </Box>
  );
};

export default AdminLayout;
