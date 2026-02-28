import { update, get } from "@/services/api.service";
import type { Order } from "@/interfases/orders.interfase";

export const ordersApi = {
  /**
   * Retorna el listado ligero de órdenes (solo header).
   * Documentación: GET /orders → solo devuelve la cabecera para optimizar listados.
   */
  findAll: async (status?: string): Promise<Order[]> => {
    const params = status ? { status } : {};
    return get<Order[]>("/orders", { params });
  },

  /**
   * Retorna la orden completa con items, core, uiState y hydratedContext.
   * Documentación: GET /orders/:id
   */
  findById: async (orderId: string): Promise<Order> => {
    return get<Order>(`/orders/${orderId}`);
  },

  updateStatus: async (orderId: string, status: "APPROVED" | "REJECTED" | "PENDING") => {
    return update("/orders", `${orderId}/status`, { status });
  },
};
