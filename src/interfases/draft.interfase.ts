export interface IDraft {
  _id: string; // Mongoose ID
  userId?: string;
  userEmail?: string;
  configuration: {
    wizardTempMaterial: any;
    mainPieces: any[];
    // Add other properties if needed
  };
  currentPricePoints: number;
  expirationDate: string; // ISO Date string
  isConverted: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDraftPayload {
  configuration: {
    wizardTempMaterial: any;
    mainPieces: any[];
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
