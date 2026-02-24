import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Cart, AddToCartPayload, CheckoutResponse, CheckoutErrorPayload } from "@/interfases/cart.interfase";
import { cartApi } from "@/services/cart.service";
import { useSocket } from "./SocketContext";
import { useAuth } from "./AuthProvider";
import type { OrderHeader } from "@/interfases/orders.interfase";

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  isProcessingCheckout: boolean;
  lastCreatedOrder: OrderHeader | null; // Nuevo
  addToCart: (payload: AddToCartPayload) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  refreshCart: () => Promise<void>;
  checkout: () => Promise<CheckoutResponse>;
  saveAsDrafts: () => Promise<void>;
  clearCart: () => Promise<void>;
  clearLastOrder: () => void; // Nuevo
  addItemsFromGroup: (groupId: string, clearFirst?: boolean) => Promise<void>; // Nuevo
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<OrderHeader | null>(null); // Nuevo
  const { socket } = useSocket();
  const { isAuthenticated } = useAuth();

  const refreshCart = useCallback(async () => {
    try {
      setLoading(true);
      const data = await cartApi.getCart();
      setCart(data);
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refreshCart();
    } else {
      setCart(null);
    }
  }, [isAuthenticated, refreshCart]);

  // Listen for WebSocket events for async checkout
  useEffect(() => {
    if (!socket) return;

    const handleOrderSuccess = (order: OrderHeader) => {
      console.log("Order created successfully:", order);
      setLastCreatedOrder(order); // Nuevo
      setIsProcessingCheckout(false);
      setCart(null); // Clear cart on success
      // Note: Navigation should be handled by the component or a global emitter
    };

    const handleOrderFail = (error: CheckoutErrorPayload) => {
      console.error("Order processing failed:", error);
      setIsProcessingCheckout(false);
    };

    socket.on("orders:new", handleOrderSuccess);
    socket.on("orders:fail", handleOrderFail);

    return () => {
      socket.off("orders:new", handleOrderSuccess);
      socket.off("orders:fail", handleOrderFail);
    };
  }, [socket]);

  const addToCart = async (payload: AddToCartPayload) => {
    try {
      const updatedCart = await cartApi.addItem(payload);
      setCart(updatedCart);
    } catch (error) {
      console.error("Error adding to cart:", error);
      throw error;
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    try {
      if (!cartItemId) {
        console.warn("Attempted to remove item with null ID");
        return;
      }
      await cartApi.removeItem(cartItemId);
      await refreshCart();
    } catch (error) {
      console.error("Error removing from cart:", error);
      throw error;
    }
  };

  const checkout = async () => {
    try {
      setIsProcessingCheckout(true);
      const response = await cartApi.checkout();
      return response;
    } catch (error) {
      setIsProcessingCheckout(false);
      console.error("Checkout failed:", error);
      throw error;
    }
  };

  const saveAsDrafts = async () => {
    try {
      setLoading(true);
      await cartApi.saveAsDrafts();
      setCart(null);
    } catch (error) {
      console.error("Error saving as drafts:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    if (!cart || cart.items.length === 0) return;
    try {
      setLoading(true);
      const ids = cart.items.map((item) => item.cartItemId || item._id || item.id).filter(Boolean) as string[];

      if (ids.length === 0) {
        setLoading(false);
        return;
      }

      await cartApi.clearCart(ids);
      await refreshCart();
    } catch (error) {
      console.error("Error clearing cart:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const clearLastOrder = () => setLastCreatedOrder(null);

  const addItemsFromGroup = async (groupId: string, clearFirst: boolean = false) => {
    try {
      setLoading(true);
      const updatedCart = await cartApi.importByGroup(groupId, clearFirst);
      setCart(updatedCart);
    } catch (error) {
      console.error("Error importing group items:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        isProcessingCheckout,
        lastCreatedOrder,
        clearLastOrder,
        addToCart,
        removeFromCart,
        refreshCart,
        checkout,
        saveAsDrafts,
        clearCart,
        addItemsFromGroup,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
