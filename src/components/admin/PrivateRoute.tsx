// src/components/admin/PrivateRoute.tsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getToken } from "@/services/authService";

const PrivateRoute: React.FC = () => {
  const isAuthenticated = !!getToken(); // Comprueba si el token existe

  return isAuthenticated ? <Outlet /> : <Navigate to="/admin/login" />;
};

export default PrivateRoute;
