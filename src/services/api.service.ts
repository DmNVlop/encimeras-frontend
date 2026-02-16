import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";
import { config } from "@/config"; // Asegúrate que esto apunta bien a tu config
import { TokenStorage } from "@/utils/token.storage";

// Definimos la estructura básica de error que esperamos del backend
interface BackendError {
  message: string | string[];
  error?: string;
  statusCode?: number;
}

/**
 * Instancia principal de Axios.
 * Configurada con la URL base y tiempos de espera.
 */
const apiClient = axios.create({
  baseURL: config.api.baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 segundos de timeout es una buena práctica
});

/**
 * INTERCEPTOR DE REQUEST
 * Inyecta el token de autenticación en cada petición si existe.
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = TokenStorage.getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * INTERCEPTOR DE RESPONSE
 * Manejo centralizado de errores (401, 403, 500) y extracción de mensajes.
 */
apiClient.interceptors.response.use(
  (response) => response, // Respuesta exitosa: Pasa limpia
  (error: AxiosError<BackendError>) => {
    let errorMessage = "Ha ocurrido un error inesperado.";

    // 1. Error de respuesta del servidor (Status code fuera del rango 2xx)
    if (error.response) {
      const { status, data } = error.response;

      // CASO CRÍTICO: 401 Unauthorized (Token vencido o inválido)
      if (status === 401) {
        const url = error.config?.url || "";
        const isAuthRequest = url.includes("/auth/") || url.includes("/login");

        console.log("Interceptor 401. URL:", url, "IsAuthRequest:", isAuthRequest);

        if (!isAuthRequest) {
          TokenStorage.clearToken();
          console.warn("Interceptor: Redirigiendo a /login (Hard Redirect)");
          window.location.href = "/login";
          return Promise.reject(new Error("Tu sesión ha expirado. Por favor ingresa nuevamente."));
        }

        console.log("Interceptor: Pass-through (Auth Request detected)");
        return Promise.reject(data);
      }

      // CASO: 403 Forbidden (Sin permisos)
      if (status === 403) {
        errorMessage = "No tienes permisos para realizar esta acción.";
      }
      // CASO: Errores controlados del backend (BadRequest con mensaje)
      else if (data) {
        // Si tenemos data, devolvemos el objeto completo para que el componente decida qué mostrar
        return Promise.reject(data);
      } else {
        errorMessage = error.response.statusText || errorMessage;
      }
    }
    // 2. Error de Red (No hubo respuesta del servidor)
    else if (error.request) {
      errorMessage = "No se pudo conectar con el servidor. Verifica tu conexión a internet.";
    }
    // 3. Error de configuración de la petición
    else {
      errorMessage = error.message;
    }

    // Rechazamos la promesa con el objeto de error si existe la data, o con un objeto construido
    return Promise.reject({ message: errorMessage, originalError: error });
  },
);

/* ==============================================
   MÉTODOS CRUD GENÉRICOS (Wrappers)
   ============================================== */

/**
 * Realiza una petición GET.
 * @template T Tipo de dato esperado en la respuesta (Array u Objeto).
 */
export const get = <T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> => {
  return apiClient.get<T>(endpoint, config).then((res) => res.data);
};

/**
 * Realiza una petición POST para crear recursos.
 * @template T Tipo del recurso que se devuelve.
 * @template B Tipo del body que se envía (opcional, infiere Partial<T> por defecto).
 */
export const create = <T, B = Partial<T>>(endpoint: string, data: B, config?: AxiosRequestConfig): Promise<T> => {
  return apiClient.post<T>(endpoint, data, config).then((res) => res.data);
};

/**
 * POST genérico (útil para acciones que no son "crear", como /auth/login o /enviar-email).
 */
export const post = <R, B = any>(endpoint: string, data: B, config?: AxiosRequestConfig): Promise<R> => {
  return apiClient.post<R>(endpoint, data, config).then((res) => res.data);
};

/**
 * Realiza una petición PATCH para actualizar parcialmente un recurso.
 */
export const update = <T>(endpoint: string, id: string | number, data: Partial<T>, config?: AxiosRequestConfig): Promise<T> => {
  return apiClient.patch<T>(`${endpoint}/${id}`, data, config).then((res) => res.data);
};

/**
 * Realiza una petición PUT (Reemplazo completo).
 * Añadido por completitud si tu API lo requiere.
 */
export const put = <T>(endpoint: string, id: string | number, data: T, config?: AxiosRequestConfig): Promise<T> => {
  return apiClient.put<T>(`${endpoint}/${id}`, data, config).then((res) => res.data);
};

/**
 * Realiza una petición DELETE.
 * Soporta borrado individual (por URL) o masivo (por Body).
 */
export const remove = (endpoint: string, ids: string[], config?: AxiosRequestConfig): Promise<any> => {
  // Borrado individual: DELETE /api/recurso/123
  if (ids.length === 1) {
    return apiClient.delete(`${endpoint}/${ids[0]}`, config).then((res) => res.data);
  }

  // Borrado múltiple: DELETE /api/recurso (Body: { ids: [...] })
  // Nota: Axios requiere que el body en DELETE vaya dentro de la propiedad `data`.
  return apiClient.delete(endpoint, { ...config, data: { ids } }).then((res) => res.data);
};

// Exportamos la instancia por si se requiere acceso directo avanzado
export default apiClient;
