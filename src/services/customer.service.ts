import { get, create, update, remove, post } from "./api.service";
import type { ICustomer, ICustomerCreate } from "@/interfases/customer.interfase";

const ENDPOINT = "/customers";

export const getCustomers = (): Promise<ICustomer[]> => {
  return get<ICustomer[]>(ENDPOINT);
};

export const getCustomerById = (id: string): Promise<ICustomer> => {
  return get<ICustomer>(`${ENDPOINT}/${id}`);
};

export const createCustomer = (customer: ICustomerCreate): Promise<ICustomer> => {
  return create<ICustomer, ICustomerCreate>(ENDPOINT, customer);
};

export const updateCustomer = (id: string, customer: Partial<ICustomer>): Promise<ICustomer> => {
  return update<ICustomer>(ENDPOINT, id, customer);
};

export const deleteCustomer = (id: string): Promise<any> => {
  return remove(ENDPOINT, [id]);
};

export const linkCustomerToUser = (customerId: string, userId: string): Promise<any> => {
  return post(`${ENDPOINT}/${customerId}/link/${userId}`, {});
};
