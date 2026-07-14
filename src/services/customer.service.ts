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
  // No reutilizar remove(`${ENDPOINT}/batch`, ...): a diferencia de otros módulos,
  // Customers tiene un path de batch distinto al singular (/customers/batch vs
  // /customers/:id, no el mismo endpoint para ambos casos) — con 1 solo id, remove()
  // arma "/customers/batch/<id>" (bug real detectado 2026-07-14: 404, borrado individual
  // desde la barra de selección no funcionaba). Con 1 id, pegarle directo a /customers/:id.
  if (customerIds.length === 1) {
    return remove(ENDPOINT, customerIds);
  }
  return apiClient.delete(`${ENDPOINT}/batch`, { data: { customerIds } }).then((res) => res.data);
};

export const batchAssignSales = (customerIds: string[], salesUserIds: string[]): Promise<any> => {
  return patch(`${ENDPOINT}/batch/assign-users`, { customerIds, assignedUserIds: salesUserIds });
};

const patch = <T>(url: string, data: any): Promise<T> => {
  return apiClient.patch<T>(url, data).then((res) => res.data);
};
