import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthProvider";
import { TokenStorage } from "../utils/token.storage";

// Definimos la URL del backend (la misma que configuraste en Axios)
const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const useSocket = () => useContext(SocketContext);

/**
 * Socket autenticado: solo conecta con sesión iniciada y envía el JWT en el handshake.
 * El backend une el socket a las salas de su alcance; sin token rechaza la conexión.
 * Se recrea al cambiar de usuario (login/logout).
 */
export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const userId = isAuthenticated ? user?._id || user?.id : undefined;

  useEffect(() => {
    if (!userId) return;

    const socketInstance = io(SOCKET_URL, {
      transports: ["websocket"], // Forzar websocket para mejor rendimiento
      reconnectionAttempts: 5,
      // Callback: en cada (re)conexión se lee el token vigente
      auth: (cb) => cb({ token: TokenStorage.getToken() }),
    });

    socketInstance.on("connect", () => setIsConnected(true));
    socketInstance.on("disconnect", () => setIsConnected(false));

    setSocket(socketInstance);

    // Limpieza estricta al cambiar de usuario o desmontar
    return () => {
      socketInstance.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [userId]);

  return <SocketContext.Provider value={{ socket, isConnected }}>{children}</SocketContext.Provider>;
};
