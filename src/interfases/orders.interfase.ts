/** Mismos estados que `order-status-flow.ts` del BE (fuente única del flujo; ver `docs/api/orders-api.md` §2.2.1). */
export type OrderStatus = "PENDING" | "REVIEWED" | "APPROVED" | "REJECTED" | "MANUFACTURING" | "SHIPPED" | "INSTALLED" | "CANCELLED";

/** Entrada append-only de `header.statusHistory`. `undo: true` = «deshacer» que revierte el último cambio vigente. */
export interface OrderStatusChange {
  from: OrderStatus;
  to: OrderStatus;
  by: string;
  byName?: string;
  byRoles?: string[];
  at: string;
  note?: string;
  undo?: boolean;
}

/** Acciones resueltas por el BE para quien pide (`GET /orders/:id`): el FE solo pinta estas. */
export interface OrderStatusActions {
  targets: OrderStatus[];
  noteRequired: OrderStatus[];
  canUndo: boolean;
  undoTo: OrderStatus | null;
}

export interface OrderHeader {
  orderNumber: string; // Ej: ORD-2026-0001
  orderName: string; // Nombre identificador del presupuesto
  userId: string; // ID del vendedor/comercial
  customerId: string; // ID del cliente b2b / final
  status: OrderStatus;
  totalOriginalPoints: number;
  totalDiscount: number;
  totalPoints: number; // Valor inmutable
  orderDate: Date | string;
  deliveryDate?: Date | string;
  statusHistory?: OrderStatusChange[]; // Órdenes anteriores a 2026-10-21 no lo tienen
}

export interface AppliedGlobalRule {
  ruleId: string;
  ruleName: string;
  discountAmount: number;
}

export interface AddonBreakdownItem {
  code: string;
  addonName: string;
  name: string;
  imageUrl?: string;
  pricePoints: number;
  measurements?: Record<string, number>;
  quantity?: number;
}

export interface PieceBreakdownItem {
  id: string;
  pieceName: string;
  materialId: string;
  materialName: string;
  materialCategory: string;
  length_mm: number;
  width_mm: number;
  basePricePoints: number;
  addons: AddonBreakdownItem[];
  subtotalPoints: number;
  discountAmount: number;
  finalPricePoints: number;
}

export interface OrderLineItem {
  cartItemId?: string;
  cartItemName: string;
  type: string;
  originalPoints: number;
  discountAmount: number;
  subtotalPoints: number;
  piecesBreakdown?: PieceBreakdownItem[];
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
  statusActions?: OrderStatusActions; // Solo en GET /orders/:id
  display?: OrderDisplay; // Solo en GET /orders/:id (BFF)
  createdAt?: string;
  updatedAt?: string;
}

/** Nombres resueltos por el BE en `GET /orders/:id` (BFF): el FE no consulta usuarios ni clientes aparte. */
export interface OrderDisplay {
  userName?: string;
  userEmail?: string;
  customerName?: string;
  customerEmail?: string;
}

/** Parámetros de la bandeja `GET /orders/search` (página empezando en 0). */
export interface OrderSearchParams {
  status?: OrderStatus[];
  q?: string;
  page?: number;
  limit?: number;
}

/** Fila de la bandeja: cabecera sin historial + nombres + última transición + acciones de quien pide. */
export interface OrderSearchItem extends Omit<OrderHeader, "statusHistory"> {
  _id: string;
  userName?: string;
  customerName?: string;
  lastStatusChangeAt: string;
  statusActions: OrderStatusActions;
}

export interface OrderSearchResult {
  items: OrderSearchItem[];
  total: number;
  page: number;
  limit: number;
  counts: Partial<Record<OrderStatus, number>>; // Alcance + texto, sin el filtro de estado
}
