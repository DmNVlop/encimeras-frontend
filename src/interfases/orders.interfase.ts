export interface OrderPreviewDrawerProps {
  open: boolean;
  onClose: () => void;
  order: Order | null; // El objeto orden completo (con header y technicalSnapshot si lo tienes cargado)
  onApprove: (orderId: string) => void;
  onOpenDetail: (orderId: string) => void; // Para ir a la vista completa 3D
}

export type OrderStatus = "PENDING" | "MANUFACTURING" | "SHIPPED" | "INSTALLED" | "CANCELLED";

export interface OrderHeader {
  orderNumber: string; // Ej: ORD-2026-0001
  userId: string; // ID del vendedor/comercial
  customerId: string; // ID del cliente b2b / final
  status: OrderStatus;
  totalOriginalPoints: number;
  totalDiscount: number;
  totalPoints: number; // Valor inmutable
  orderDate: Date | string;
  deliveryDate?: Date | string;
}

export interface AppliedGlobalRule {
  ruleId: string;
  ruleName: string;
  discountAmount: number;
}

export interface OrderLineItem {
  cartItemId?: string;
  cartItemName: string; // Trazabilidad técnica (ej: "Cocina de Juana")
  type: string;
  originalPoints: number;
  discountAmount: number;
  subtotalPoints: number; // Precio final con descuento de la línea
  core?: {
    mainPieces: any[];
    factoryId?: string;
    customerId?: string;
  };
  uiState?: any;
  hydratedContext?: {
    materials: any[];
    [key: string]: any;
  };
  technicalSnapshot?: {
    materials: any[];
    pieces: any[];
    mainPieces?: any[];
    addons: any[];
    [key: string]: any;
  };
}

export interface Order {
  _id: string; // Mongoose Document ID
  header: OrderHeader;
  items: OrderLineItem[];
  appliedGlobalRules?: AppliedGlobalRule[];
  originDraftId?: string;
  createdAt?: string;
  updatedAt?: string;
}
