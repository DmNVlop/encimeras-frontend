// d:\Proyectos\DEV\presupuesto-encimeras\frontend\src\interfases\cart.interfase.ts

export interface CartItem {
  _id?: string;
  id?: string;
  cartItemId: string; // ID real devuelto por la API de carrito
  customName: string;
  technicalSnapshot: any; // Mapeado desde el backend
  configuration?: any; // Mantener por compatibilidad si se usa en otros sitios
  subtotalPoints: number;
  draftId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Cart {
  _id: string;
  userId: string;
  items: CartItem[];
  totalPoints: number;
  status: "ACTIVE" | "CONVERTED";
  createdAt?: string;
  updatedAt?: string;
}

export interface AddToCartPayload {
  customName: string;
  configuration: any;
  subtotalPoints: number;
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
