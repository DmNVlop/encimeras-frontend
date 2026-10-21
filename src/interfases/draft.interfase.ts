import type { CoreEntityDto, UIStateDto } from "./core.interfase";

export interface IDraft {
  _id: string; // Mongoose ID
  name?: string; // Custom name
  userId?: string;
  userEmail?: string;
  core: CoreEntityDto; // REQUERIDO: Contrato estricto
  uiState?: UIStateDto; // OPCIONAL: Metadatos Visuales
  configuration?: {
    wizardTempMaterial: any;
    mainPieces: any[];
    selectedShapeId?: string | null;
  }; // DEPRECATED: Mantener por compatibilidad temporal
  originalPoints: number;
  discountAmount: number;
  currentPricePoints: number; // EL BACKEND IGNORARÁ ESTO AL GUARDAR, SE RECALCULA
  expirationDate: string; // ISO Date string
  isConverted: boolean;
  cartGroupId?: string; // Nuevo: ID para agrupar borradores
  quoteTraceId?: string; // Id de trazabilidad del presupuesto (estable en draft → cart → order)
  isOwn?: boolean; // GET /drafts: false = ajeno dentro del alcance (equipo/cliente), se abre como copia
  ownerName?: string; // GET /drafts: nombre del dueño si es ajeno
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDraftPayload {
  name?: string;
  quoteTraceId?: string; // Trazabilidad; si falta (copia), el backend genera uno nuevo
  core: CoreEntityDto;
  uiState?: UIStateDto;
}

export interface DraftResponse {
  message: string;
  id: string;
  expirationDate: string;
}

export interface GetDraftResponse {
  status: "VALID" | "EXPIRED_RECALCULATED";
  message: string;
  data: IDraft;
  newPrice?: number;
  isOwn?: boolean; // false = borrador ajeno en alcance: se carga como copia (guardar crea uno propio)
}
