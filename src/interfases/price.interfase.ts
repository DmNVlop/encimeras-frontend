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
  id: string;
  pieceName: string;
  materialName: string;
  basePricePoints: number;
  subtotalPoints: number;
  discountAmount: number;
  finalPricePoints: number;
  addons: BreakdownAddon[];
}

export interface AppliedRule {
  ruleId: string;
  ruleName: string;
  discountAmount: number;
}

export interface CalculationResponse {
  totalPoints: number;
  finalTotalPoints: number;
  totalDiscount: number;
  appliedRules: AppliedRule[];
  pieces: BreakdownPiece[];
}
