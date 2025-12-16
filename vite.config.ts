import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          "mui-core": ["@mui/material", "@emotion/react", "@emotion/styled"],
          "mui-icons": ["@mui/icons-material"],
          "mui-datagrid": ["@mui/x-data-grid"],
          babylon: ["@babylonjs/core", "@babylonjs/loaders"],
        },
      },
    },
  },
});
