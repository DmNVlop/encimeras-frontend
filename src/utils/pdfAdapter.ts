import { useMemo } from "react";
import type { Cart, CartItem } from "../../interfases/cart.interfase";
import type { AppliedAddon } from "../../context/QuoteInterfases";

export interface ExtractedPiece {
  id: string;
  dimensions: string;
  materialName: string;
  addons: AppliedAddon[];
}

export interface ExtractedItem {
  cartItemId: string;
  name: string;
  subtotal: number;
  pieces: ExtractedPiece[];
}

export interface PdfData {
  orderId: string;
  date: string;
  expiration: string;
  total: number;
  items: ExtractedItem[];
}

/**
 * Función pura que transforma el carrito en un modelo plano y seguro para PDF.
 * Separar esta lógica permite que sea unit-testeable sin depender de React.
 */
export const mapCartToPdfModel = (cart: Cart | null | undefined): PdfData | null => {
  if (!cart || !cart.items || cart.items.length === 0) return null;

  // 1. Recopilar todos los materiales de todos los items para tener un mapa consolidado
  const materialsMap = new Map<string, string>();
  cart.items.forEach((item) => {
    const materials = item.hydratedContext?.materials || [];
    materials.forEach((mat: any) => {
      // Usamos tanto _id como id por si acaso
      if (mat._id) materialsMap.set(mat._id, mat.name);
      if (mat.id) materialsMap.set(mat.id, mat.name);
    });
  });

  // 2. Mapear cada item defensivamente
  const processedItems: ExtractedItem[] = cart.items.map((item: CartItem, itemIndex: number) => {
    const mainPieces = item.core?.mainPieces || [];

    const pieces: ExtractedPiece[] = mainPieces.map((piece, pieceIndex) => {
      const materialName = materialsMap.get(piece.materialId) || "Material no especificado";

      // Defensa contra valores numéricos nulos o faltantes
      const length = piece.length_mm ?? 0;
      const width = piece.width_mm ?? 0;

      return {
        id: `piece-${item.cartItemId || itemIndex}-${pieceIndex}`,
        dimensions: `${length} x ${width} mm`,
        materialName,
        addons: piece.appliedAddons || [],
      };
    });

    return {
      cartItemId: item.cartItemId || `item-${itemIndex}`,
      name: item.customName || "Estancia sin nombre",
      subtotal: item.subtotalPoints ?? 0,
      pieces,
    };
  });

  return {
    orderId: cart._id,
    date: cart.createdAt ? new Date(cart.createdAt).toLocaleDateString("es-ES") : new Date().toLocaleDateString("es-ES"),
    // Asumimos una validez de 15 días si no viene expiresAt
    expiration: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString("es-ES"),
    total: cart.totalPoints ?? 0,
    items: processedItems,
  };
};

/**
 * Custom Hook que memoriza el cálculo del PDF
 */
export const usePdfData = (cart: Cart | null | undefined) => {
  return useMemo(() => mapCartToPdfModel(cart), [cart]);
};
