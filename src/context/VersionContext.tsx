import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { config } from "@/config";

interface VersionState {
  frontendVersion: string;
  backendVersion: string | null;
  backendEnvironment: string | null;
  swUpdateAvailable: boolean;
  updateSW: () => void;
}

const VersionContext = createContext<VersionState | null>(null);

export function VersionProvider({ children }: { children: ReactNode }) {
  const [backendVersion, setBackendVersion] = useState<string | null>(null);
  const [backendEnvironment, setBackendEnvironment] = useState<string | null>(null);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  const updateSW = useCallback(() => {
    updateServiceWorker(true);
  }, [updateServiceWorker]);

  useEffect(() => {
    fetch(`${config.api.baseURL}/version`)
      .then((res) => res.json())
      .then((data) => {
        setBackendVersion(data.version ?? null);
        setBackendEnvironment(data.environment ?? null);
      })
      .catch(() => {
        // silencioso — backend puede no estar disponible offline
      });
  }, []);

  return (
    <VersionContext.Provider
      value={{
        frontendVersion: import.meta.env.VITE_APP_VERSION ?? "0.0.0",
        backendVersion,
        backendEnvironment,
        swUpdateAvailable: needRefresh,
        updateSW,
      }}
    >
      {children}
    </VersionContext.Provider>
  );
}

export function useVersion(): VersionState {
  const ctx = useContext(VersionContext);
  if (!ctx) throw new Error("useVersion must be used inside <VersionProvider>");
  return ctx;
}
