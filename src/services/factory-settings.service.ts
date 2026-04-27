import apiClient, { get } from "./api.service";

export interface IFactorySettings {
  _id?: string;
  factoryId?: string;
  logoUrl: string | null;
  logoFilename: string | null;
  createdAt?: string;
  updatedAt?: string;
}

const BASE_URL = "/factory-settings";

export const factorySettingsService = {
  async getSettings(): Promise<IFactorySettings | null> {
    return get<IFactorySettings>(BASE_URL);
  },

  async uploadLogo(file: File): Promise<IFactorySettings> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.patch<IFactorySettings>(`${BASE_URL}/logo`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  async deleteLogo(): Promise<IFactorySettings> {
    const response = await apiClient.delete<IFactorySettings>(`${BASE_URL}/logo`);
    return response.data;
  },
};
