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
  pricePoints: number;
}

export interface BreakdownPiece {
  pieceName: string;
  basePricePoints: number;
  subtotalPoints: number;
  addons: BreakdownAddon[];
}

export interface CalculationResponse {
  totalPoints: number;
  pieces: BreakdownPiece[];
}
