// src/services/drafts.api.ts
import type { CreateDraftPayload, DraftResponse, GetDraftResponse } from "@/interfases/draft.interfase";
import apiClient from "./api.service";

export const draftsApi = {
  // 1. Guardar un NUEVO borrador (POST)
  create: async (payload: CreateDraftPayload) => {
    // Ajusta la URL base si no la tienes configurada globalmente en axios
    return apiClient.post<DraftResponse>("/drafts", payload);
  },

  // 2. Actualizar un borrador EXISTENTE (PUT)
  // Nota: Asegúrate de que tu backend tenga el endpoint @Put(':id') o reutiliza el POST si ajustaste la lógica
  update: async (id: string, payload: CreateDraftPayload) => {
    return apiClient.put<DraftResponse>(`/drafts/${id}`, payload);
  },

  // 3. Recuperar un borrador por ID (GET)
  getById: async (id: string) => {
    return apiClient.get<GetDraftResponse>(`/drafts/${id}`);
  },

  // 4. Convertir a Orden (POST)
  convertToOrder: async (payload: { draftId: string; customerId: string }) => {
    return apiClient.post("/orders", payload);
  },
};
