import { get, create, update, remove } from "./api.service";
import type { IDiscountRule, IDiscountRuleCreate } from "@/interfases/discount-rule.interfase";

const ENDPOINT = "/discount-rules";

export const getDiscountRules = (): Promise<IDiscountRule[]> => {
  return get<IDiscountRule[]>(ENDPOINT);
};

export const createDiscountRule = (rule: IDiscountRuleCreate): Promise<IDiscountRule> => {
  return create<IDiscountRule, IDiscountRuleCreate>(ENDPOINT, rule);
};

export const updateDiscountRule = (id: string, rule: Partial<IDiscountRule>): Promise<IDiscountRule> => {
  return update<IDiscountRule>(ENDPOINT, id, rule);
};

export const deleteDiscountRule = (id: string): Promise<any> => {
  return remove(ENDPOINT, [id]);
};
