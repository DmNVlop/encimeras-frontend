import { update, get } from "@/services/api.service"; // Tu utilidad genérica

export const ordersApi = {
  // Método específico y tipado
  findAll: async (status?: string) => {
    const params = status ? { status } : {};
    return get<any[]>("/orders", { params }); // Ajustar tipo de retorno a Order[] cuando sea posible importarlo aqui o dejar any[] y castear
  },

  updateStatus: async (orderId: string, status: "APPROVED" | "REJECTED" | "PENDING") => {
    // Aquí usamos tu utilidad genérica
    // Endpoint: '/orders'
    // ID: orderId + '/status' para coincidir con la ruta del backend
    return update("/orders", `${orderId}/status`, { status });
  },
};
