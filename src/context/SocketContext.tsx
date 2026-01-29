import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

// Definimos la URL del backend (la misma que configuraste en Axios)
const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // 1. Inicialización ÚNICA al montar la app
    const socketInstance = io(SOCKET_URL, {
      transports: ["websocket"], // Forzar websocket para mejor rendimiento
      reconnectionAttempts: 5,
    });

    // 2. Listeners de estado de conexión
    socketInstance.on("connect", () => {
      console.log("🟢 Conectado a WS");
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      console.log("🔴 Desconectado de WS");
      setIsConnected(false);
    });

    setSocket(socketInstance);

    // 3. Limpieza estricta al desmontar la app completa
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return <SocketContext.Provider value={{ socket, isConnected }}>{children}</SocketContext.Provider>;
};
