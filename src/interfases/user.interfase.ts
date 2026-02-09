import type { UserRole } from "@/types/auth.types";

// Interfaz del Usuario en tu contexto
export interface User {
  userId: number;
  username: string;
  roles: UserRole[]; // Array estricto de nuestro Enum
  password?: string;
  name?: string; // Nombre real para mostrar en el UI
  email?: string; // Útil para notificaciones
  phone?: string; // Teléfono para mostrar en el UI
}
