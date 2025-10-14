export interface PriceConfig {
    _id: string;
    combinationKey: string;
    pricePerSquareMeter: number;
}

export interface PriceRuleAttribute {
    type: string;
    value: string;
}