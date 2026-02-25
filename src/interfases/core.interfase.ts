// d:\Proyectos\DEV\presupuesto-encimeras\frontend\src\interfases\core.interfase.ts
import type { SelectedAttributes, AppliedAddon } from "../context/QuoteInterfases";

/**
 * DTO para una pieza en el contrato estricto del motor de cálculo.
 */
export interface MainPieceDto {
  materialId: string;
  length_mm: number;
  width_mm: number;
  selectedAttributes: SelectedAttributes;
  appliedAddons: AppliedAddon[];
}

/**
 * Contrato estricto de Negocio (Core)
 * El motor de cálculo solo mira este objeto.
 */
export interface CoreEntityDto {
  mainPieces: MainPieceDto[];
  factoryId?: string;
}

/**
 * Estado opaco para el backend (UI State)
 * El backend lo guarda y devuelve pero NO lo valida.
 */
export interface UIStateDto extends Record<string, any> {
  wizardTempMaterial?: any;
  selectedShapeId?: string | null;
  currentStep?: number;
  lastStep?: number;
}

/**
 * Contexto hidratado inyectado por el backend en las respuestas GET.
 */
export interface HydratedContextDto {
  materials?: any[]; // Podríamos tiparlo mejor si tenemos la interfaz de material completa
  [key: string]: any;
}
