// src/services/apiService.ts
import axios, { AxiosError } from 'axios';
import { getToken, logout } from './authService';

const apiClient = axios.create({
    baseURL: 'http://localhost:3000', // La URL de tu backend
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
        let errorMessage = 'Ha ocurrido un error inesperado.';

        if (error.response) {
            // El servidor respondió con un código de estado fuera del rango 2xx
            const status = error.response.status;
            const data: any = error.response.data;

            if (status === 401) {
                // Error de no autorizado: cerramos sesión y redirigimos
                logout();
                window.location.href = '/admin/login';
                // No devolvemos un error, ya que la redirección manejará el flujo
                return Promise.reject(new Error("Sesión expirada."));
            }

            if (status === 400 && Array.isArray(data.message)) {
                // Errores de validación: unimos el array en un solo string
                errorMessage = data.message.join('\n');
            } else if (data.message) {
                // Otros errores de la API con un mensaje claro
                errorMessage = data.message;
            } else {
                errorMessage = error.response.statusText;
            }

        } else if (error.request) {
            // La petición se hizo pero no se recibió respuesta (error de red)
            errorMessage = 'No se pudo conectar con el servidor. Revisa tu conexión a internet.';
        } else {
            // Algo ocurrió al configurar la petición
            errorMessage = error.message;
        }

        // Rechazamos la promesa con el mensaje de error formateado
        return Promise.reject(errorMessage);
    },
);

// Funciones genéricas para el CRUD
export const get = <T>(endpoint: string): Promise<T[]> => {
    return apiClient.get(endpoint).then(res => res.data);
};

export const create = <T>(endpoint: string, data: T): Promise<T> => {
    return apiClient.post(endpoint, data).then(res => res.data);
};

export const update = <T>(endpoint: string, id: string, data: Partial<T>): Promise<T> => {
    return apiClient.patch(`${endpoint}/${id}`, data).then(res => res.data);
};

export const remove = (endpoint: string, id: string): Promise<void> => {
    return apiClient.delete(`${endpoint}/${id}`).then(res => res.data);
};
