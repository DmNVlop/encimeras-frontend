// src/config/index.ts

export const config = {
  api: {
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
    timeout: 10000, // Tiempo máximo de espera
  },
  assets: {
    // Aquí aplicamos la lógica del prefijo que hablamos antes
    baseUrl: import.meta.env.VITE_ASSETS_URL || "http://localhost:3000/",
  },
  // Puedes agregar otras configuraciones globales aquí
  app: {
    name: "Presupuestador Encimeras",
    version: "0.1.0",
  },
};
