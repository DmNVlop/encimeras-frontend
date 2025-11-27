// src/services/apiService.ts
import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { config } from "../config";

import { getToken, logout } from "./authService";

const apiClient = axios.create({
  baseURL: config.api.baseURL, // La URL de tu backend
});

// Interceptor para añadir el token a todas las peticiones
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Interceptor para MANEJAR los errores de todas las respuestas
apiClient.interceptors.response.use(
  (response) => response, // Si la respuesta es exitosa, la devuelve sin más
  (error: AxiosError) => {
    let errorMessage = "Ha ocurrido un error inesperado.";

    if (error.response) {
      const status = error.response.status;
      const data: any = error.response.data;

      if (status === 401) {
        logout();
        window.location.href = "/admin/login";
        return Promise.reject(new Error("Sesión expirada."));
      }

      if (status === 400 && Array.isArray(data.message)) {
        errorMessage = data.message.join("\n");
      } else if (data.message) {
        errorMessage = data.message;
      } else {
        errorMessage = error.response.statusText;
      }
    } else if (error.request) {
      errorMessage = "No se pudo conectar con el servidor. Revisa tu conexión a internet.";
    } else {
      errorMessage = error.message;
    }

    return Promise.reject(errorMessage);
  },
);

// Funciones genéricas para el CRUD
export const get = <T>(endpoint: string, config?: AxiosRequestConfig): Promise<T[]> => {
  return apiClient.get(endpoint, config).then((res) => res.data);
};

export const create = <T>(endpoint: string, data: Partial<T>): Promise<T> => {
  return apiClient.post(endpoint, data).then((res) => res.data);
};

// R = Response Type (Lo que devuelve el backend)
// B = Body Type (Lo que tú envías) - Por defecto 'any' para no complicarte si no quieres
export const post = <R, B = any>(endpoint: string, data: B): Promise<R> => {
  return apiClient.post<R>(endpoint, data).then((res) => res.data);
};

export const update = <T>(endpoint: string, id: string, data: Partial<T>): Promise<T> => {
  return apiClient.patch(`${endpoint}/${id}`, data).then((res) => res.data);
};

export const remove = (endpoint: string, ids: string[]): Promise<any> => {
  if (ids.length === 1) {
    // Si solo hay un ID, usamos el endpoint /:id para mayor claridad
    return apiClient.delete(`${endpoint}/${ids[0]}`).then((res) => res.data);
  }
  // Si hay varios IDs, los enviamos en el body
  return apiClient.delete(endpoint, { data: { ids } }).then((res) => res.data);
};
