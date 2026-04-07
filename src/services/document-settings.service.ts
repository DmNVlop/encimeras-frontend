import { get, post, update } from "./api.service";

export interface IDocumentSettings {
  _id?: string;
  factoryId?: string;
  userId?: string | null;
  validityDays: number;
  footerText: string;
  createdAt?: string;
  updatedAt?: string;
}

const BASE_URL = "/document-settings";

export const documentSettingsService = {
  async getSettings(): Promise<IDocumentSettings | null> {
    return get<IDocumentSettings>(BASE_URL);
  },

  async getSettingsById(id: string): Promise<IDocumentSettings> {
    return get<IDocumentSettings>(`${BASE_URL}/${id}`);
  },

  async createSettings(data: { validityDays: number; footerText: string; userId?: string | null }): Promise<IDocumentSettings> {
    return post<IDocumentSettings>(BASE_URL, data);
  },

  async updateSettings(id: string, data: Partial<{ validityDays: number; footerText: string }>): Promise<IDocumentSettings> {
    return update<IDocumentSettings>(BASE_URL, id, data);
  },
};
