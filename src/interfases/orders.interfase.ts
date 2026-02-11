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
  customerId: string; // ID del usuario o referencia externa
  status: OrderStatus;
  totalPoints: number; // Valor inmutable
  orderDate: Date | string;
  deliveryDate?: Date | string;
}

export interface OrderLineItem {
  type: string;
  technicalSnapshot: {
    materials: any[];
    pieces: any[]; // MainPieces con medidas finales
    addons: any[]; // Accesorios aplicados
    [key: string]: any; // Allow other properties just in case
  };
}

export interface Order {
  _id: string; // Mongoose Document ID
  header: OrderHeader;
  items: OrderLineItem[];
  originDraftId?: string;
  createdAt?: string;
  updatedAt?: string;
}
