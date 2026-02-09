// hooks/useAuth.ts
import { useContext } from "react";
import { AuthContext } from "../context/AuthProvider";

export const useAuth = () => {
  const context = useContext(AuthContext);

  // Guard clause: Si intentas usar useAuth fuera del <AuthProvider>, lanza error.
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }

  return context;
};
