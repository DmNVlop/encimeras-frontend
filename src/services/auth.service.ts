// services/auth.service.ts
import type { User } from "@/interfases/user.interfase";
import { TokenStorage } from "../utils/token.storage";
import apiClient from "./api.service";
import type { AuthResponse, LoginCredentials } from "@/interfases/login-credentials.interfase";

export const AuthService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    // 1. POST al login real
    const { data } = await apiClient.post<AuthResponse>("/auth/login", credentials);

    // 2. Retornaremos la respuesta completa para que el Provider decida qué guardar
    return data;
  },

  logout: () => {
    TokenStorage.clearToken();
    // Opcional: Llamar al backend si invalidan tokens del lado servidor
    // apiClient.post('/auth/logout').catch(() => {});
  },

  getMe: async (): Promise<User> => {
    // Este endpoint es vital para "rehidratar" la app al recargar (F5)
    // Usa el token que ya está en headers gracias al interceptor
    const { data } = await apiClient.get<User>("/auth/me");
    return data;
  },
};
