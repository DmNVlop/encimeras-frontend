// src/services/authService.ts
import axios from 'axios';
import type { LoginDto } from '../types/LoginDto';

// Configura una instancia de Axios con la URL base de tu API
const apiClient = axios.create({
    baseURL: 'http://localhost:3000', // La URL de tu backend
});

export const login = async (credentials: LoginDto) => {
    try {
        const response = await apiClient.post('/auth/login', credentials);
        if (response.data.access_token) {
            // Guardamos el token en localStorage para mantener la sesión
            localStorage.setItem('authToken', response.data.access_token);
        }
        return response.data;
    } catch (error) {
        console.error('Error en el login:', error);
        throw error;
    }
};

export const logout = () => {
    localStorage.removeItem('authToken');
};

export const getToken = () => {
    return localStorage.getItem('authToken');
};
