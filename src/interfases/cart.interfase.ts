// d:\Proyectos\DEV\presupuesto-encimeras\frontend\src\interfases\cart.interfase.ts

export interface CartItem {
  _id: string;
  customName: string;
  configuration: any; // technicalSnapshot/QuoteConfig
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
