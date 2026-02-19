import { Role, type User } from "@/interfases/user.interfase";
import type { AuthResponse } from "@/interfases/login-credentials.interfase";

// Usamos los roles definidos en la interfaz de usuario
export const UserRole = Role;
export type UserRole = Role;

// Definición de la estructura de una Ruta Protegida
export interface AppRouteConfig {
  path: string;
  // ComponentType permite componentes funcionales o de clase
  // LazyExoticComponent es el tipo de retorno de React.lazy
  // component: React.LazyExoticComponent<React.ComponentType<any>>;
  component: React.ComponentType<any>; // Simplificado para aceptar Lazy
  allowedRoles: UserRole[];
  children?: AppRouteConfig[];
}

// Esta es la "forma" de nuestro contexto
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean; // Para acciones (login/logout)
  isInitializing: boolean; // Para el arranque de la app
  login: (email: string, password: string) => Promise<AuthResponse>;
  logout: () => void;
}
