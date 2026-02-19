import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";

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
  Collapse,
  ListSubheader,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SettingsIcon from "@mui/icons-material/Settings";
import TuneIcon from "@mui/icons-material/Tune";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import logo from "@/assets/logos/kuuk-logo.png";
import { useAuth } from "@/context/AuthProvider";

const drawerWidth = 260;

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({
    Configuración: true,
    Parametrización: true,
  });

  // Auto-open menus if a child is active
  useEffect(() => {
    const activeMenu = menuConfig.find((item) => item.children?.some((child) => location.pathname.startsWith(child.path || "none")));
    if (activeMenu) {
      setOpenMenus((prev) => ({ ...prev, [activeMenu.text]: true }));
    }
  }, [location.pathname]);

  const toggleMenu = (text: string) => {
    setOpenMenus((prev) => ({ ...prev, [text]: !prev[text] }));
  };

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

  interface NavItem {
    text: string;
    icon?: React.ReactNode;
    path?: string;
    type?: "item" | "divider" | "subheader";
    children?: NavItem[];
  }

  const menuConfig: NavItem[] = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/admin/dashboard", type: "item" },
    { text: "Ordenes", icon: <ShoppingBagIcon />, path: "/admin/orders", type: "item" },
    { text: "Presupuestos", icon: <ReceiptLongIcon />, path: "/admin/budgets", type: "item" },
    { text: "divider", type: "divider" },
    { text: "ADMINISTRACIÓN", type: "subheader" },
    {
      text: "Configuración",
      icon: <SettingsIcon />,
      type: "item",
      children: [
        { text: "Usuarios", path: "/admin/users" },
        { text: "Clientes", path: "/admin/customers" },
        { text: "Identidad", path: "/admin/identity" },
      ],
    },
    {
      text: "Parametrización",
      icon: <TuneIcon />,
      type: "item",
      children: [
        { text: "Atributos", path: "/admin/attributes" },
        { text: "Materiales", path: "/admin/materials" },
        { text: "Reglas Medidas", path: "/admin/rule-sets" },
        { text: "Complementos", path: "/admin/addons" },
        { text: "Precios", path: "/admin/price-configs" },
      ],
    },
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
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box",
            borderRight: "1px solid",
            borderColor: "divider",
            backgroundColor: "#fff",
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: "auto", px: 2, py: 1 }}>
          <List disablePadding>
            {menuConfig.map((item, index) => {
              if (item.type === "divider") {
                return <Divider key={`divider-${index}`} sx={{ my: 1.5, opacity: 0.6 }} />;
              }

              if (item.type === "subheader") {
                return (
                  <ListSubheader
                    key={`subheader-${index}`}
                    sx={{
                      bgcolor: "transparent",
                      color: "text.secondary",
                      fontWeight: 700,
                      fontSize: "0.65rem",
                      letterSpacing: "0.08em",
                      lineHeight: "24px",
                      mt: 1,
                      mb: 0.5,
                      pl: 1,
                    }}
                  >
                    {item.text}
                  </ListSubheader>
                );
              }

              const isCollapsible = !!(item.children && item.children.length > 0);
              const isOpen = openMenus[item.text];
              const isChildActive = item.children?.some((child) => location.pathname === child.path);
              const isParentActive = location.pathname === item.path;
              const isActive = isParentActive || isChildActive;

              return (
                <Box key={item.text}>
                  <ListItem disablePadding sx={{ mb: 0.25 }}>
                    <ListItemButton
                      {...(!isCollapsible && item.path ? { component: NavLink, to: item.path } : { onClick: () => toggleMenu(item.text) })}
                      sx={{
                        borderRadius: "10px",
                        minHeight: "38px",
                        px: 1.5,
                        transition: "all 0.2s ease",
                        bgcolor: isActive && !isCollapsible ? "rgba(99, 102, 241, 0.08)" : "transparent",
                        color: isActive ? "primary.main" : "#64748b",
                        "& .MuiListItemIcon-root": {
                          color: isActive ? "primary.main" : "#94a3b8",
                          minWidth: "34px",
                          transition: "color 0.2s ease",
                        },
                        "& .MuiListItemText-primary": {
                          fontWeight: isActive ? 600 : 500,
                          fontSize: "0.85rem",
                          transition: "font-weight 0.2s ease",
                        },
                        "&:hover": {
                          bgcolor: "rgba(0, 0, 0, 0.03)",
                          "& .MuiListItemIcon-root": { color: "primary.main" },
                          "& .MuiListItemText-primary": { color: "primary.main" },
                        },
                        "&.active": {
                          bgcolor: "rgba(99, 102, 241, 0.08)",
                          color: "primary.main",
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: "34px", color: "inherit", "& .MuiSvgIcon-root": { fontSize: "1.25rem" } }}>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.text} />
                      {isCollapsible ? (
                        isOpen ? (
                          <ExpandLess sx={{ fontSize: "1.0rem", opacity: 0.5 }} />
                        ) : (
                          <ExpandMore sx={{ fontSize: "1.0rem", opacity: 0.5 }} />
                        )
                      ) : null}
                    </ListItemButton>
                  </ListItem>

                  {isCollapsible && (
                    <Collapse in={isOpen} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding sx={{ pl: 2, position: "relative" }}>
                        {/* Vertical line for nesting */}
                        <Box
                          sx={{
                            position: "absolute",
                            left: "17px",
                            top: 0,
                            bottom: 14,
                            width: "1.5px",
                            bgcolor: "rgba(0,0,0,0.06)",
                            borderRadius: "1px",
                          }}
                        />

                        {item.children?.map((child) => {
                          const isChildCurrent = location.pathname === child.path;
                          return (
                            <ListItem key={child.text} disablePadding sx={{ mb: 0.1 }}>
                              <ListItemButton
                                component={NavLink}
                                to={child.path || "#"}
                                sx={{
                                  borderRadius: "8px",
                                  minHeight: "32px",
                                  pl: 3.5,
                                  position: "relative",
                                  "&::before": {
                                    content: '""',
                                    position: "absolute",
                                    left: "17px",
                                    top: "50%",
                                    width: "8px",
                                    height: "1.5px",
                                    bgcolor: "rgba(0,0,0,0.06)",
                                  },
                                  color: isChildCurrent ? "primary.main" : "#64748b",
                                  "& .MuiListItemText-primary": {
                                    fontWeight: isChildCurrent ? 600 : 400,
                                    fontSize: "0.8rem",
                                  },
                                  "&.active": {
                                    color: "primary.main",
                                    bgcolor: "transparent",
                                  },
                                  "&:hover": {
                                    bgcolor: "rgba(0,0,0,0.02)",
                                    "& .MuiListItemText-primary": {
                                      color: "primary.main",
                                    },
                                    "&::before": {
                                      bgcolor: "primary.light",
                                    },
                                  },
                                }}
                              >
                                <ListItemText primary={child.text} />
                              </ListItemButton>
                            </ListItem>
                          );
                        })}
                      </List>
                    </Collapse>
                  )}
                </Box>
              );
            })}
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
