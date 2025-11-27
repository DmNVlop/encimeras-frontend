export interface Attribute {
    _id: string;
    id?: string;
    type: string;
    value: string;
    label?: string;
    isActive: boolean;
}

export interface AttributeToRead {
    _id: string;
    id?: string;
    value: string;
    label?: string;
}

export interface AttributeToConfigPrice {
    _id: string;
    id?: string;
    type: string;
    value: string;
    label?: string;
}