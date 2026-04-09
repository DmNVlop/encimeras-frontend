export const Role = {
  ADMIN: "ADMIN", // Superusuario
  OWNER: "OWNER", // Propietario de fábrica
  USER: "USER", // Cliente final
  SALES: "SALES", // Comercial / Vendedor
  WORKER: "WORKER", // Operario de fábrica
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export interface User {
  _id: string; // ID único de MongoDB (CRUD)
  id?: string; // Alias devuelto en Login
  username: string; // Nombre de usuario / Login
  name?: string; // Nombre real
  email?: string; // Email de contacto
  phone?: string; // Teléfono
  roles: Role[]; // Array de roles
  factoryId?: string; // ID de fábrica (requerido para roles OWNER)
  ownerId?: string; // ⭐ NUEVO: Referencia al OWNER que gestiona este usuario
  createdBy?: string; // ⭐ NUEVO: ID del usuario que creó este registro
  createdAt: string;
  updatedAt: string;
  password?: string; // Opcional para creación/edición
}
