// src/services/apiService.ts
import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { config } from "@/config";

import { getToken, logout } from "./authService";

/**
 * Axios instance configured with the base URL and interceptors.
 * Handles authentication token injection and centralized error handling.
 */
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

/**
 * Generic function to perform a GET request.
 *
 * @template T - The expected return type of the response data (array of items).
 * @param {string} endpoint - The API endpoint URL (relative to base URL).
 * @param {AxiosRequestConfig} [config] - Optional Axios configuration.
 * @returns {Promise<T[]>} A promise that resolves to the response data (typed as T[]).
 */
export const get = <T>(endpoint: string, config?: AxiosRequestConfig): Promise<T[]> => {
  return apiClient.get(endpoint, config).then((res) => res.data);
};

/**
 * Generic function to create a new resource via a POST request.
 *
 * @template T - The type of the resource being created.
 * @param {string} endpoint - The API endpoint URL (relative to base URL).
 * @param {Partial<T>} data - The data payload for the new resource.
 * @returns {Promise<T>} A promise that resolves to the created resource.
 */
export const create = <T>(endpoint: string, data: Partial<T>): Promise<T> => {
  return apiClient.post(endpoint, data).then((res) => res.data);
};

/**
 * Generic function to perform a POST request with custom response and body types.
 *
 * @template R - The expected response type.
 * @template B - The type of the request body (defaults to any).
 * @param {string} endpoint - The API endpoint URL (relative to base URL).
 * @param {B} data - The data payload to send.
 * @returns {Promise<R>} A promise that resolves to the response data.
 */
export const post = <R, B = any>(endpoint: string, data: B): Promise<R> => {
  return apiClient.post<R>(endpoint, data).then((res) => res.data);
};

/**
 * Generic function to update an existing resource via a PATCH request.
 *
 * @template T - The type of the resource being updated.
 * @param {string} endpoint - The API endpoint URL (relative to base URL).
 * @param {string} id - The unique identifier of the resource to update.
 * @param {Partial<T>} data - The partial data to update.
 * @returns {Promise<T>} A promise that resolves to the updated resource.
 */
export const update = <T>(endpoint: string, id: string, data: Partial<T>): Promise<T> => {
  return apiClient.patch(`${endpoint}/${id}`, data).then((res) => res.data);
};

/**
 * Generic function to delete one or multiple resources.
 * If a single ID is provided, it sends a DELETE request to `endpoint/:id`.
 * If multiple IDs are provided, it sends a DELETE request to `endpoint` with the IDs in the body.
 *
 * @param {string} endpoint - The API endpoint URL (relative to base URL).
 * @param {string[]} ids - An array of unique identifiers of the resources to delete.
 * @returns {Promise<any>} A promise that resolves to the response data.
 */
export const remove = (endpoint: string, ids: string[]): Promise<any> => {
  if (ids.length === 1) {
    // Si solo hay un ID, usamos el endpoint /:id para mayor claridad
    return apiClient.delete(`${endpoint}/${ids[0]}`).then((res) => res.data);
  }
  // Si hay varios IDs, los enviamos en el body
  return apiClient.delete(endpoint, { data: { ids } }).then((res) => res.data);
};
