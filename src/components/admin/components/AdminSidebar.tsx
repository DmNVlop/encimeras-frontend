import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Box, Drawer, List, ListItem, ListItemText, ListItemIcon, ListItemButton, Divider, Collapse, ListSubheader, Toolbar } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SettingsIcon from "@mui/icons-material/Settings";
import TuneIcon from "@mui/icons-material/Tune";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import CalculateIcon from "@mui/icons-material/Calculate";

interface NavItem {
  text: string;
  icon?: React.ReactNode;
  path?: string;
  type?: "item" | "divider" | "subheader";
  children?: NavItem[];
}

const menuConfig: NavItem[] = [
  { text: "Dashboard", icon: <DashboardIcon />, path: "/admin/dashboard", type: "item" },
  { text: "Presupuestador", icon: <CalculateIcon />, path: "/dashboard", type: "item" },
  { text: "Ordenes", icon: <ShoppingBagIcon />, path: "/admin/orders", type: "item" },
  // { text: "Borradores", icon: <ReceiptLongIcon />, path: "/admin/drafts", type: "item" },
  { text: "divider", type: "divider" },
  { text: "ADMINISTRACIÓN", type: "subheader" },
  {
    text: "Configuración",
    icon: <SettingsIcon />,
    type: "item",
    children: [
      { text: "Usuarios", path: "/admin/users" },
      { text: "Clientes", path: "/admin/customers" },
      // { text: "Identidad", path: "/admin/identity" },
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

interface AdminSidebarProps {
  drawerWidth: number;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ drawerWidth }) => {
  const location = useLocation();
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

  return (
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
                    <ListItemIcon
                      sx={{
                        minWidth: "34px",
                        color: "inherit",
                        "& .MuiSvgIcon-root": { fontSize: "1.25rem" },
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
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
  );
};

export default AdminSidebar;
