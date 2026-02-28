import { useMemo } from "react";

export interface ExtractedAddon {
  code: string;
  measurementsMap: Record<string, number | undefined>;
  attributesMap: Record<string, string>;
  quantity?: number;
}

export interface ExtractedPiece {
  id: string;
  dimensions: string;
  materialName: string;
  attributes: Record<string, string>;
  addons: ExtractedAddon[];
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
  subtotalBruto: number;
  totalDescuento: number;
  appliedGlobalRules?: { ruleName: string; discountAmount: number }[];
  items: ExtractedItem[];
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerNif?: string;
  userName?: string;
  userRole?: string;
  logoStr?: string;
}

/**
 * Resuelve las reglas de descuento aplicadas desde múltiples fuentes, en orden de prioridad:
 *
 * 1. cart.appliedGlobalRules  → El carrito en vivo trae nombre y valor completos ✅
 * 2. item.appliedRules / item.appliedDiscounts → Algunas versiones del API lo ponen por línea
 * 3. Regla sintética derivada de header.totalDiscount → Para órdenes que solo traen el total
 *    (útil hasta que el backend enriquezca GET /orders/:id con appliedGlobalRules)
 */
const resolveAppliedRules = (
  cartOrOrder: any,
  itemsArray: any[],
  isOrder: boolean,
  totalDiscount: number | undefined,
): { ruleName: string; discountAmount: number }[] | undefined => {
  // Prioridad 1: reglas globales explícitas en la raíz (carrito)
  if (cartOrOrder.appliedGlobalRules?.length > 0) {
    return cartOrOrder.appliedGlobalRules;
  }

  // Prioridad 2: reglas en el nivel de ítem (appliedRules o appliedDiscounts)
  const itemLevelRules: { ruleName: string; discountAmount: number }[] = [];
  itemsArray.forEach((item: any) => {
    const rules: any[] = item.appliedRules || item.appliedDiscounts || [];
    rules.forEach((r: any) => {
      if (r.ruleName && r.discountAmount) {
        const existing = itemLevelRules.find((x) => x.ruleName === r.ruleName);
        if (existing) {
          // Acumular el mismo descuento si se repite en varios ítems
          existing.discountAmount += r.discountAmount;
        } else {
          itemLevelRules.push({ ruleName: r.ruleName, discountAmount: r.discountAmount });
        }
      }
    });
  });
  if (itemLevelRules.length > 0) return itemLevelRules;

  // Prioridad 3: regla sintética cuando solo tenemos el total del descuento (Orden)
  // Solo la creamos si hay un descuento real > 0
  if (isOrder && totalDiscount && totalDiscount > 0) {
    return [{ ruleName: "Descuento aplicado al pedido", discountAmount: totalDiscount }];
  }

  return undefined;
};

/**
 * Función pura que transforma el carrito en un modelo plano y seguro para PDF.
 * Separar esta lógica permite que sea unit-testeable sin depender de React.
 */
export const mapCartToPdfModel = (cartOrOrder: any | null | undefined, user?: any, customer?: any): PdfData | null => {
  if (!cartOrOrder) return null;

  const isOrder = "header" in cartOrOrder;

  // Normalizar array de items (en las Order el backend puede colapsarlo en un .technicalSnapshot raíz)
  const itemsArray =
    cartOrOrder.items?.length > 0
      ? cartOrOrder.items
      : isOrder && cartOrOrder.technicalSnapshot
        ? [{ technicalSnapshot: cartOrOrder.technicalSnapshot, cartItemName: "Pedido Completo" }]
        : [];

  if (!itemsArray || itemsArray.length === 0) return null;

  // 1. Recopilar todos los materiales
  // Para el CARRITO: el backend hidrata los materiales en item.hydratedContext.materials
  // Para la ORDEN: NO hay hydratedContext ni technicalSnapshot. El único nombre
  //   disponible está en item.uiState.wizardTempMaterial.materialName (por materialId).
  const materialsMap = new Map<string, string>();
  itemsArray.forEach((item: any) => {
    // Fuente 1: hydratedContext (Carrito BFF)
    const hydratedMaterials: any[] = item.hydratedContext?.materials || [];
    hydratedMaterials.forEach((mat: any) => {
      if (mat._id) materialsMap.set(mat._id, mat.name || mat.materialName);
      if (mat.id) materialsMap.set(mat.id, mat.name || mat.materialName);
    });

    // Fuente 2: technicalSnapshot (si existiese en un futuro endpoint enriquecido)
    const snapshotMaterials: any[] = item.technicalSnapshot?.materials || [];
    snapshotMaterials.forEach((mat: any) => {
      if (mat._id) materialsMap.set(mat._id, mat.name || mat.materialName);
      if (mat.id) materialsMap.set(mat.id, mat.name || mat.materialName);
      if (mat.materialId) materialsMap.set(mat.materialId, mat.name || mat.materialName);
    });

    // Fuente 3: uiState.wizardTempMaterial (Órdenes — única fuente disponible a día de hoy)
    const wiz = item.uiState?.wizardTempMaterial;
    if (wiz?.materialId && wiz?.materialName) {
      materialsMap.set(wiz.materialId, wiz.materialName);
    }
  });

  // 2. Mapear cada item defensivamente
  const processedItems: ExtractedItem[] = itemsArray.map((item: any, itemIndex: number) => {
    // ─── Fuente de piezas ─────────────────────────────────────────────────────
    // Para CARRITO → item.core.mainPieces
    // Para ORDEN   → item.core.mainPieces (misma estructura; NO hay technicalSnapshot actualmente)
    // Fallback final → item.technicalSnapshot.pieces por compatibilidad futura
    const mainPieces: any[] = item.core?.mainPieces || item.technicalSnapshot?.pieces || item.technicalSnapshot?.mainPieces || [];

    const pieces: ExtractedPiece[] = mainPieces.map((piece: any, pieceIndex: number) => {
      const materialName = materialsMap.get(piece.materialId) || "Material no especificado";

      const length = piece.length_mm ?? piece.measurements?.length_mm ?? 0;
      const width = piece.width_mm ?? piece.measurements?.width_mm ?? 0;

      const uiPiece = isOrder ? piece : item.uiState?.mainPieces?.[pieceIndex]; // in Order, piece might already be the uiState piece
      const sourceAddons = piece.appliedAddons?.length > 0 ? piece.appliedAddons : uiPiece?.appliedAddons || [];

      const mappedAddons: ExtractedAddon[] = sourceAddons.map((addon: any) => ({
        code: addon.code,
        measurementsMap: addon.measurements || {},
        attributesMap: addon.selectedAttributes || {},
        quantity: addon.quantity ?? addon.measurements?.quantity,
      }));

      // Extraer atributos del shape (del material seleccionado o de UI)
      const attributes = piece.selectedAttributes || uiPiece?.selectedAttributes || item.uiState?.wizardTempMaterial?.selectedAttributes || {};

      return {
        id: `piece-${item.cartItemId || itemIndex}-${pieceIndex}`,
        dimensions: `${length} x ${width} mm`,
        materialName,
        attributes,
        addons: mappedAddons,
      };
    });

    return {
      cartItemId: item.cartItemId || `item-${itemIndex}`,
      name: isOrder ? item.cartItemName || "Estancia de Pedido" : item.customName || "Estancia sin nombre",
      // En CARRITO: subtotalPoints (precio con descuento de línea)
      // En ORDEN:   originalPoints - discountAmount (subtotalPoints no viene del backend de órdenes)
      subtotal: item.subtotalPoints != null ? item.subtotalPoints : (item.originalPoints ?? 0) - (item.discountAmount ?? 0),
      pieces,
    };
  });

  const baseTotal = isOrder ? cartOrOrder.header.totalPoints : cartOrOrder.totalPoints;
  const baseSubtotal = isOrder ? cartOrOrder.header.totalOriginalPoints : cartOrOrder.totalOriginalPoints;
  const baseDiscount = isOrder ? cartOrOrder.header.totalDiscount : cartOrOrder.totalDiscount;

  const subtotalBruto =
    baseSubtotal || itemsArray.reduce((sum: number, item: any) => sum + (item.originalPoints || item.subtotalPoints || item.subtotal || 0), 0);

  return {
    orderId: isOrder ? cartOrOrder.header.orderNumber : cartOrOrder._id,
    date: isOrder
      ? new Date(cartOrOrder.header.orderDate).toLocaleDateString("es-ES")
      : cartOrOrder.createdAt
        ? new Date(cartOrOrder.createdAt).toLocaleDateString("es-ES")
        : new Date().toLocaleDateString("es-ES"),
    expiration: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString("es-ES"),
    total: baseTotal ?? 0,
    subtotalBruto,
    totalDescuento: baseDiscount ?? 0,
    appliedGlobalRules: resolveAppliedRules(cartOrOrder, itemsArray, isOrder, baseDiscount),
    items: processedItems,
    customerName:
      customer?.officialName ||
      customer?.commercialName ||
      (customer?.firstName ? `${customer.firstName} ${customer.lastName || ""}`.trim() : "Consumidor Final"),
    customerNif: customer?.nif || "",
    customerEmail: customer?.contact?.email || "No especificado",
    customerPhone: customer?.contact?.phone || "No especificado",
    customerAddress: customer?.address?.addressLine1 ? `${customer.address.addressLine1}${customer.address.city ? `, ${customer.address.city}` : ""}` : "",
    userName: user?.name,
    userRole: user?.roles?.[0] || "Gestor",
    logoStr: "/logos/kuuk-logo.png", // Usualmente es mejor en base64 para pdf pero react-pdf acepta URLs absolutas/relativas del public folder
  };
};

/**
 * Custom Hook que memoriza el cálculo del PDF
 */
export const usePdfData = (cartOrOrder: any | null | undefined, user?: any, customer?: any) => {
  return useMemo(() => mapCartToPdfModel(cartOrOrder, user, customer), [cartOrOrder, user, customer]);
};
