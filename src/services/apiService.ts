// src/services/apiService.ts
import axios from 'axios';
import { getToken } from './authService';

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
