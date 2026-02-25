// d:\Proyectos\DEV\presupuesto-encimeras\frontend\src\interfases\cart.interfase.ts

import type { CoreEntityDto, UIStateDto, HydratedContextDto } from "./core.interfase";

export interface CartItem {
  _id?: string;
  id?: string;
  cartItemId: string; // ID real devuelto por la API de carrito
  customName: string;
  core: CoreEntityDto; // REQUERIDO: Contrato estricto
  uiState?: UIStateDto; // OPCIONAL: Metadatos Visuales
  hydratedContext?: HydratedContextDto; // INYECTADO POR BACKEND EN GET
  configuration?: any; // Mantener por compatibilidad si se usa en otros sitios (deprecated)
  originalPoints: number;
  discountAmount: number;
  subtotalPoints: number;
  draftId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Cart {
  _id: string;
  userId: string;
  items: CartItem[];
  totalOriginalPoints: number;
  totalDiscount: number;
  totalPoints: number;
  status: "ACTIVE" | "CONVERTED";
  createdAt?: string;
  updatedAt?: string;
}

export interface AddToCartPayload {
  customName: string;
  core: CoreEntityDto;
  uiState?: UIStateDto;
  draftId?: string;
}

export interface CheckoutResponse {
  message: string;
  jobId: string;
  status: "processing" | "completed" | "failed";
}

export interface CheckoutErrorPayload {
  jobId: string;
  customerId: string;
  message: string;
}
