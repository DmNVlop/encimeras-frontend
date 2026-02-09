// components/guards/RoleGuard.tsx (Versión Final)
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { UserRole } from "../../types/auth.types";
import { useAuth } from "@/hooks/useAuth";

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // 1. PANTALLA DE CARGA: Esperar a verificar sesión antes de redirigir
  if (isLoading) {
    return <div>Verificando permisos...</div>; // O tu componente <Spinner />
  }

  // 2. Si la ruta es pública (no tiene roles especificados), renderizar directamente
  // Esto evita bucles infinitos en /login y permite acceso a /quote
  if (!allowedRoles || allowedRoles.length === 0) {
    return children ? <>{children}</> : <Outlet />;
  }

  // 3. Si terminó de cargar y no está autenticado (y la ruta NO es pública)
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 4. Verificar Roles
  const hasPermission = user?.roles.some((role) => allowedRoles.includes(role));

  if (!hasPermission) {
    return <Navigate to="/403" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
