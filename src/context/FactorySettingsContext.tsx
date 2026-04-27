import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { factorySettingsService, type IFactorySettings } from "@/services/factory-settings.service";
import { useAuth } from "@/context/AuthProvider";

interface FactorySettingsContextType {
  settings: IFactorySettings | null;
  logoUrl: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setSettings: (s: IFactorySettings | null) => void;
}

const FactorySettingsContext = createContext<FactorySettingsContextType | undefined>(undefined);

export const FactorySettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [settings, setSettings] = useState<IFactorySettings | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await factorySettingsService.getSettings();
      setSettings(data);
    } catch {
      // No bloquear si falla (puede ser fábrica sin settings aún)
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refresh();
    } else {
      setSettings(null);
    }
  }, [isAuthenticated, refresh]);

  return (
    <FactorySettingsContext.Provider value={{ settings, logoUrl: settings?.logoUrl ?? null, loading, refresh, setSettings }}>
      {children}
    </FactorySettingsContext.Provider>
  );
};

export const useFactorySettings = () => {
  const ctx = useContext(FactorySettingsContext);
  if (!ctx) throw new Error("useFactorySettings must be used within FactorySettingsProvider");
  return ctx;
};
