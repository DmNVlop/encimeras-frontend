// context/AuthProvider.tsx
import React, { createContext, useState, useEffect, type ReactNode } from "react";
import { type AuthContextType } from "../types/auth.types";
import { AuthService } from "../services/auth.service";
import { TokenStorage } from "../utils/token.storage";
import type { User } from "@/interfases/user.interfase";
import type { LoginCredentials } from "@/interfases/login-credentials.interfase";

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // --- EFECTO DE INICIALIZACIÓN (F5 / Recarga) ---
  useEffect(() => {
    const initializeAuth = async () => {
      const token = TokenStorage.getToken();

      // Si no hay token, no hay sesión. Terminamos carga.
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        // Hay token, pero ¿es válido? Preguntamos al backend.
        // Si el token expiró hace 5 min, el backend dará 401,
        // el interceptor de Axios capturará el error y redirigirá.
        // Pero por seguridad, manejamos el error aquí también.
        const userData = await AuthService.getMe();

        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Token inválido al iniciar", error);
        TokenStorage.clearToken();
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // --- ACCIONES ---
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    const credentials: LoginCredentials = { username, password };
    try {
      const data = await AuthService.login(credentials);
      console.log("Login exitoso context: ", data);

      // Guardamos Token
      TokenStorage.setToken(data.access_token);

      // Guardamos Usuario
      setUser(data.user);
      setIsAuthenticated(true);

      return data; // Retornamos para que el componente pueda hacer redirecciones extras si quiere
    } catch (error) {
      throw error; // Dejamos que el componente Login maneje el error visual
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
    setIsAuthenticated(false);
    // Redirección manual o dejar que el Router lo maneje al detectar isAuthenticated false
  };

  return <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
