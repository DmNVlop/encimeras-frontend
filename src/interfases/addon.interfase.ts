// src/interfases/addon.interfase.ts

// Esta interfaz representa la estructura de un Addon
export interface Addon {
  // --- Identificadores ---
  _id: string;
  id?: string;
  code: string; // UNIFICADO: Antes 'addonCode'. Usaremos 'code' en todo el proyecto.
  name: string;

  // --- UI & Lógica de Visualización ---
  category: "TRABAJO" | "ENSAMBLAJE" | "COMPLEMENTO" | "OTRO";

  // ¡IMPORTANTE! Este campo debe venir del backend para saber qué inputs pintar.
  // Si tu backend no lo manda, tendremos que calcularlo en el front, pero lo ideal es que venga.
  requiredMeasurements: ("quantity" | "length_ml" | "width_mm")[];

  allowedMaterialCategories: string[]; // Para filtrar si es HPL, Compacto, etc.
  imageUrl?: string; // Opcional para el futuro
  description?: string; // Opcional para tooltips

  // --- Campos de Lógica de Negocio (Backend) ---
  // Los mantenemos opcionales por si el objeto viene completo,
  // pero no los usaremos en el JSX del Wizard.
  pricingType?: "COMBINATION_BASED" | "RANGE_BASED" | "FIXED";
  productTypeMap?: string;
  measurementRuleSetId?: string;
  inheritedAttributes?: string[];
}
