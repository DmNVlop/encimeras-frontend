export const CustomerType = {
  INDIVIDUAL: "INDIVIDUAL",
  COMPANY: "COMPANY",
} as const;
export type CustomerType = (typeof CustomerType)[keyof typeof CustomerType];

export interface ICustomerContact {
  phone?: string;
  email?: string;
  website?: string;
  socialMedia?: string[];
}

export interface ICustomerAddress {
  country?: string;
  fullName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  region?: string;
  cp?: string;
}

export interface ICustomer {
  _id?: string;
  type: CustomerType;
  officialName: string;
  firstName?: string;
  lastName?: string;
  commercialName?: string;
  description?: string;
  nif?: string;
  birthDate?: Date | string;
  gender?: string;
  legalRepresentative?: string;
  isActive: boolean;
  factoryId: string;
  platformUserId?: string;
  discountProfile?: number;
  taxProfile?: number;
  contact: ICustomerContact;
  address: ICustomerAddress;
  createdAt?: string;
  updatedAt?: string;
}

export interface ICustomerCreate extends Omit<ICustomer, "_id" | "factoryId" | "isActive" | "createdAt" | "updatedAt"> {
  factoryId?: string;
  isActive?: boolean;
}
