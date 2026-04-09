import { get } from "./api.service";

export interface IGlobalSettings {
  multiSalesPerCustomer: boolean;
  [key: string]: any;
}

export class GlobalSettingsService {
  private static readonly BASE_URL = "/settings/global";

  static async getSettings(): Promise<IGlobalSettings> {
    try {
      return await get<IGlobalSettings>(this.BASE_URL);
    } catch (error) {
      console.warn("Error fetching global settings, using defaults", error);
      // Retornar valores por defecto si el endpoint no existe
      return {
        multiSalesPerCustomer: true, // Por defecto permitir múltiples sales
      };
    }
  }

  static async getMultiSalesPerCustomer(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.multiSalesPerCustomer;
  }
}
