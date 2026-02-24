import { get, post, remove } from "./api.service";
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
   * Elimina un ítem del carrito
   */
  removeItem: async (cartItemId: string) => {
    return remove("/cart/items", [cartItemId]);
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
};
