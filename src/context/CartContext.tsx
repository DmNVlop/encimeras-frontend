import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Cart, AddToCartPayload, CheckoutResponse, CheckoutErrorPayload } from "@/interfases/cart.interfase";
import { cartApi } from "@/services/cart.service";
import { useSocket } from "./SocketContext";
import type { OrderHeader } from "@/interfases/orders.interfase";

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  isProcessingCheckout: boolean;
  addToCart: (payload: AddToCartPayload) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  refreshCart: () => Promise<void>;
  checkout: () => Promise<CheckoutResponse>;
  saveAsDrafts: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const { socket } = useSocket();

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
    refreshCart();
  }, [refreshCart]);

  // Listen for WebSocket events for async checkout
  useEffect(() => {
    if (!socket) return;

    const handleOrderSuccess = (order: OrderHeader) => {
      console.log("Order created successfully:", order);
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

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        isProcessingCheckout,
        addToCart,
        removeFromCart,
        refreshCart,
        checkout,
        saveAsDrafts,
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
