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
  currentPricePoints: number; // EL BACKEND IGNORARÁ ESTO AL GUARDAR, SE RECALCULA
  expirationDate: string; // ISO Date string
  isConverted: boolean;
  cartGroupId?: string; // Nuevo: ID para agrupar borradores
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDraftPayload {
  name?: string;
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
}
