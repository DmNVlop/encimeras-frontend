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
      // Silenciosamente usar defaults si el endpoint no existe
      return {
        multiSalesPerCustomer: true,
      };
    }
  }

  static async getMultiSalesPerCustomer(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.multiSalesPerCustomer;
  }
}
