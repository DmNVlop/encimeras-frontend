export interface CreateDraftPayload {
  configuration: {
    wizardTempMaterial: any;
    mainPieces: any[];
    // Agrega aquí otros datos globales si los tienes (ej. globalAddons)
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
  data: any; // El objeto draft completo
  newPrice?: number;
}
