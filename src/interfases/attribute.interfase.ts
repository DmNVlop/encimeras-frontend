export interface Attribute {
    _id: string;
    type: string;
    value: string;
    label?: string;
    isActive: boolean;
}

export interface AttributeToRead {
    _id: string;
    value: string;
    label?: string;
}

export interface AttributeToConfigPrice {
    _id: string;
    type: string;
    value: string;
    label?: string;
}