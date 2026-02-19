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
  const [isLoading, setIsLoading] = useState(false); // Para acciones (login/logout)
  const [isInitializing, setIsInitializing] = useState(true); // Para el arranque de la app

  // --- EFECTO DE INICIALIZACIÓN (F5 / Recarga) ---
  useEffect(() => {
    const initializeAuth = async () => {
      const token = TokenStorage.getToken();

      if (!token) {
        setIsInitializing(false);
        return;
      }

      try {
        const userData = await AuthService.getMe();
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Token inválido al iniciar", error);
        TokenStorage.clearToken();
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsInitializing(false);
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
      TokenStorage.setToken(data.access_token);
      setUser(data.user);
      setIsAuthenticated(true);
      return data;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const refreshUser = async () => {
    try {
      const userData = await AuthService.getMe();
      setUser(userData);
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

  return <AuthContext.Provider value={{ user, isAuthenticated, isLoading, isInitializing, login, logout, refreshUser }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
