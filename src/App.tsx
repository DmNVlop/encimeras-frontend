// src/App.tsx
import { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";

import type { AppRouteConfig } from "./types/auth.types";
import { AuthProvider } from "./context/AuthProvider";
import { RoleGuard } from "./components/guards/RoleGuard";
import { appRoutes } from "./config/routes.config";

// Loading Fallback Component
const LoadingFallback = () => (
  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
    <CircularProgress />
  </Box>
);

function App() {
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

  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Generar todas las rutas desde la config */}
            {renderRoutes(appRoutes)}

            {/* Redirección por defecto */}
            <Route path="*" element={<Navigate to="/quote" />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
