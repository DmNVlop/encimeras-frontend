// src/App.tsx
import { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";

import type { AppRouteConfig } from "./types/auth.types";
import { AuthProvider } from "./context/AuthProvider";
import { RoleGuard } from "./components/guards/RoleGuard";
import { appRoutes } from "./config/routes.config";

import { useAuth } from "./context/AuthProvider";

// Loading Fallback Component
const LoadingFallback = () => (
  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
    <CircularProgress />
  </Box>
);

/**
 * Componente que contiene la lógica de rutas y tiene acceso al contexto de autenticación
 */
const AppRouter = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Función recursiva para renderizar rutas y sub-rutas
  const renderRoutes = (routes: AppRouteConfig[]) => {
    return routes.map((route) => {
      // 1. Definimos el elemento: ¿Necesita protección?
      const element = (
        <RoleGuard allowedRoles={route.allowedRoles}>
          <route.component />
        </RoleGuard>
      );

      // 2. Si tiene hijos (como /admin), usamos recursividad
      if (route.children) {
        return (
          <Route key={route.path} path={route.path} element={element}>
            {/* React Router renderizará esto donde pongas el <Outlet /> en tu AdminLayout */}
            {renderRoutes(route.children)}
          </Route>
        );
      }

      // 3. Ruta normal sin hijos
      return <Route key={route.path} path={route.path} element={element} />;
    });
  };

  if (isLoading) {
    return <LoadingFallback />;
  }

  return (
    <Router>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* 
            REDIRECCIÓN DE INICIO: 
            Si el usuario llega a '/' y está autenticado, lo mandamos al dashboard.
            Si no lo está, el RoleGuard de la ruta '/' (UserPortalLayout) se encargará de pedir login
            o el renderRoutes pintará la ruta normal.
          */}
          {isAuthenticated && <Route path="/" element={<Navigate to="/dashboard" replace />} />}

          {/* Generar todas las rutas desde la config */}
          {renderRoutes(appRoutes)}

          {/* Redirección por defecto para rutas no encontradas */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;
