import { update } from "@/services/apiService"; // Tu utilidad genérica

export const ordersApi = {
  // Método específico y tipado
  updateStatus: async (orderId: string, status: "APPROVED" | "REJECTED" | "PENDING") => {
    // Aquí usamos tu utilidad genérica
    // Endpoint: '/orders'
    // ID: orderId + '/status' para coincidir con la ruta del backend
    return update("/orders", `${orderId}/status`, { status });
  },
};
