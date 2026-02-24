export interface PriceConfig {
  _id: string;
  combinationKey: string;
  pricePerSquareMeter: number;
}

export interface PriceRuleAttribute {
  type: string;
  value: string;
}

// =============================================================================
// INTERFACES LOCALES (Para tipar la respuesta del Backend)
// =============================================================================
export interface BreakdownAddon {
  addonName: string;
  name?: string;
  imageUrl?: string;
  pricePoints: number;
}

export interface BreakdownPiece {
  pieceName: string;
  basePricePoints: number;
  subtotalPoints: number;
  originalPrice?: number;
  finalPrice?: number;
  discountAmount?: number;
  addons: BreakdownAddon[];
}

export interface AppliedRule {
  ruleId: string;
  ruleName: string;
  discountAmount: number;
}

export interface CalculationResponse {
  totalPoints: number;
  originalTotal?: number;
  finalTotal?: number;
  totalDiscount?: number;
  appliedRules?: AppliedRule[];
  pieces: BreakdownPiece[];
}
