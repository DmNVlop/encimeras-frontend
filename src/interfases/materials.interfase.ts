// Define la estructura de datos real del material
export interface Material {
    _id: string;
    name: string;
    description?: string;
    imageUrl?: string;
    thicknesses: number[];
    finishes: string[];
    faces: string[];
    groups: string[];
    category: string;
    type: string;
    isActive: boolean;
}

// Define la estructura de los datos para el formulario (con arrays como strings)
export interface MaterialFormData {
    _id?: string;
    name?: string;
    description?: string;
    imageUrl?: string;
    thicknesses?: string;
    faces?: string;
    groups?: string;
    finishes?: string;
    category?: string;
    type?: string;
    isActive?: boolean;
}