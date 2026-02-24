export interface IDraft {
  _id: string; // Mongoose ID
  name?: string; // Custom name
  userId?: string;
  userEmail?: string;
  configuration: {
    wizardTempMaterial: any;
    mainPieces: any[];
    // Add other properties if needed
    selectedShapeId?: string | null;
  };
  currentPricePoints: number;
  expirationDate: string; // ISO Date string
  isConverted: boolean;
  cartGroupId?: string; // Nuevo: ID para agrupar borradores
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDraftPayload {
  name?: string;
  configuration: {
    wizardTempMaterial: any;
    mainPieces: any[];
    selectedShapeId?: string | null;
  };
  currentPricePoints: number;
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
