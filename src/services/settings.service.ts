// import { get } from "./api.service";
import type { LoginSettings } from "@/types/settings.types";

/**
 * Service to handle application settings fetched from the admin panel.
 */
export const SettingsService = {
  /**
   * Fetches the specific settings for the login page.
   * If the endpoint doesn't exist yet, it could return default values.
   */
  getLoginSettings: async (): Promise<LoginSettings | null> => {
    try {
      // Endpoint planned for admin-managed settings
      // return await get<LoginSettings>("/settings/public/login");

      // For now, mirroring what the user asked: "preparala para cargarlo"
      // We can return a mock or just return null to trigger defaults in the component
      return null;
    } catch (error) {
      console.error("Error fetching login settings:", error);
      return null;
    }
  },
};
