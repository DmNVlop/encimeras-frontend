export const DiscountType = {
  PERCENTAGE: "PERCENTAGE",
  FIXED_AMOUNT: "FIXED_AMOUNT",
} as const;
export type DiscountType = (typeof DiscountType)[keyof typeof DiscountType];

export const DiscountScope = {
  GLOBAL_TOTAL: "GLOBAL_TOTAL",
  SPECIFIC_MATERIALS: "SPECIFIC_MATERIALS",
  MATERIAL_CATEGORIES: "MATERIAL_CATEGORIES",
} as const;
export type DiscountScope = (typeof DiscountScope)[keyof typeof DiscountScope];

export const CollisionStrategy = {
  SUM: "SUM",
  MAX: "MAX",
  MIN: "MIN",
  CASCADE: "CASCADE",
} as const;
export type CollisionStrategy = (typeof CollisionStrategy)[keyof typeof CollisionStrategy];

export const CustomerStrategy = {
  ALL: "ALL",
  SPECIFIC_CUSTOMERS: "SPECIFIC_CUSTOMERS",
} as const;
export type CustomerStrategy = (typeof CustomerStrategy)[keyof typeof CustomerStrategy];

export interface IDiscountRuleConditions {
  startDate?: Date | string;
  endDate?: Date | string;
  customerStrategy: CustomerStrategy;
  targetCustomers: string[]; // ObjectIds
  minOrderValue?: number;
}

export interface IDiscountRule {
  _id?: string;
  name: string;
  type: DiscountType;
  value: number;
  scope: DiscountScope;
  priority: number;
  collisionStrategy: CollisionStrategy;
  stackable: boolean;
  isActive: boolean;
  conditions: IDiscountRuleConditions;
  factoryId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IDiscountRuleCreate extends Omit<IDiscountRule, "_id" | "factoryId" | "isActive" | "createdAt" | "updatedAt"> {
  factoryId?: string;
  isActive?: boolean;
}
