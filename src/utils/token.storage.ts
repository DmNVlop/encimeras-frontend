// utils/token.storage.ts
const TOKEN_KEY = "auth_token";

export const TokenStorage = {
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken: (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
  },

  clearToken: () => {
    localStorage.removeItem(TOKEN_KEY);
  },

  // Opcional: Si el token es un JWT y quieres leer la expiración en el cliente
  // decodeToken: (token: string) => jwtDecode(token)
};
