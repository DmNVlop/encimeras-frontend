import { get, post, remove, put } from "./api.service";
import type { Cart, AddToCartPayload, CheckoutResponse } from "@/interfases/cart.interfase";

export const cartApi = {
  /**
   * Obtiene el carrito activo del usuario
   */
  getCart: async () => {
    return get<Cart>("/cart");
  },

  /**
   * Añade una configuración al carrito
   */
  addItem: async (payload: AddToCartPayload) => {
    return post<Cart, AddToCartPayload>("/cart/items", payload);
  },

  /**
   * Actualiza una configuración existente en el carrito
   */
  updateItem: async (cartItemId: string, payload: AddToCartPayload) => {
    return put<Cart, AddToCartPayload>("/cart/items", cartItemId, payload);
  },

  /**
   * Elimina un ítem del carrito
   */
  removeItem: async (cartItemId: string) => {
    return remove("/cart/items", [cartItemId]);
  },

  /**
   * Vacía el carrito eliminando todos los ítems
   */
  clearCart: async (cartItemIds: string[]) => {
    return remove("/cart/items", cartItemIds);
  },

  /**
   * Convierte el contenido del carrito en borradores agrupados
   */
  saveAsDrafts: async () => {
    return post<{ message: string }>("/cart/save-as-drafts", {});
  },

  /**
   * Inicia el proceso de checkout asíncrono
   */
  checkout: async () => {
    return post<CheckoutResponse>("/cart/checkout", {});
  },

  /**
   * Importa todos los elementos de un grupo de borradores al carrito
   */
  importByGroup: async (groupId: string, clearFirst: boolean = false) => {
    return post<Cart>(`/cart/items/group/${groupId}`, { clearFirst });
  },
};
