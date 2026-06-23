import { get, create, update, remove, post } from "./api.service";
import apiClient from "./api.service";
import type { ICustomer, ICustomerCreate } from "@/interfases/customer.interfase";
import type { User } from "@/interfases/user.interfase";

const ENDPOINT = "/customers";
const USERS_ENDPOINT = "/users";

export const getCustomers = (): Promise<ICustomer[]> => {
  return get<ICustomer[]>(ENDPOINT);
};

export const getSalesUsers = (): Promise<User[]> => {
  return get<User[]>(`${USERS_ENDPOINT}?role=SALES`).catch((error) => {
    // Si es 403, el usuario no tiene permisos - retornar array vacío
    if (error?.originalError?.response?.status === 403) {
      return [];
    }
    throw error; // Re-lanzar otros errores
  });
};

export const getPlatformUsers = (): Promise<User[]> => {
  return get<User[]>(USERS_ENDPOINT);
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

export const batchDeleteCustomers = (customerIds: string[]): Promise<any> => {
  return remove(`${ENDPOINT}/batch`, customerIds, undefined, "customerIds");
};

export const batchAssignSales = (customerIds: string[], salesUserIds: string[]): Promise<any> => {
  return patch(`${ENDPOINT}/batch/assign-users`, { customerIds, assignedUserIds: salesUserIds });
};

const patch = <T>(url: string, data: any): Promise<T> => {
  return apiClient.patch<T>(url, data).then((res) => res.data);
};
