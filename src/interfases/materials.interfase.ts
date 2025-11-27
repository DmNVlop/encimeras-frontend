// Define la estructura de una receta de precios, igual que en el backend.
// Reemplaza al antiguo 'pricingAttributes: string[]'
export interface PricingRecipe {
    productType: string; // Ej: 'COUNTERTOP', 'CLADDING'
    pricingAttributes: string[]; // Ej: ['MAT_GROUP', 'MAT_FINISH']
    unit: 'm2' | 'ml';
}

// Define la estructura de datos real del material
export interface Material {
    _id: string;
    name: string;
    description?: string;
    ref?: string;
    imageUrl?: string;
    category: string;
    type: string;
    isActive: boolean;

    // --- CAMPO DE PRECIOS ---
    pricingRecipes: PricingRecipe[];

    // --- CAMPO DE WIZARD ---
    selectableAttributes: string[];

    // Numero de combinaciones existentes para el material(Verificar logica en backend).
    validCombinationsCount?: number;
}

// Define la estructura de los datos para el formulario (con arrays como strings)
export interface MaterialFormData {
    _id?: string;
    name?: string;
    description?: string;
    ref?: string;
    imageUrl?: string;
    category?: string;
    type?: string;
    isActive?: boolean;

    pricingRecipes: PricingRecipe[];
    selectableAttributes: string[];
}