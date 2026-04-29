import { get, post, update, remove } from "./api.service";
import type { User } from "@/interfases/user.interfase";
import type { TransferOwnerDto, BatchTransferDto, TransferManagerDto, BatchTransferManagerDto, BatchTransferResponse } from "@/interfases/transfer-owner.dto";

const ENDPOINT = "/users";

export const getUsers = (params?: { role?: string; managed?: boolean }): Promise<User[]> => {
  const queryParams = new URLSearchParams();
  if (params?.role) queryParams.append("role", params.role);
  if (params?.managed) queryParams.append("managed", "true");

  const query = queryParams.toString();
  return get<User[]>(`${ENDPOINT}${query ? "?" + query : ""}`);
};

export const getUserById = (id: string): Promise<User> => {
  return get<User>(`${ENDPOINT}/${id}`);
};

export const getManagedUsers = (): Promise<User[]> => {
  return get<User[]>(`${ENDPOINT}/managed`);
};

export const getOwnerUsers = (): Promise<User[]> => {
  return getUsers({ role: "OWNER" });
};

export const getManagerUsers = (): Promise<User[]> => {
  return get<User[]>(`${ENDPOINT}/managers`);
};

export const getSalesUsers = (): Promise<User[]> => {
  return getUsers({ role: "SALES" });
};

export const createUser = (data: Partial<User>): Promise<User> => {
  return post<User>(ENDPOINT, data);
};

export const updateUser = (id: string, data: Partial<User>): Promise<User> => {
  return update<User>(ENDPOINT, id, data);
};

export const deleteUser = (id: string): Promise<void> => {
  return remove(ENDPOINT, [id]);
};

export const transferOwner = (userId: string, dto: TransferOwnerDto): Promise<User> => {
  return post<User>(`${ENDPOINT}/${userId}/transfer-owner`, dto);
};

export const batchTransferOwner = (dto: BatchTransferDto): Promise<BatchTransferResponse> => {
  return post<BatchTransferResponse>(`${ENDPOINT}/batch-transfer`, dto);
};

export const transferManager = (userId: string, dto: TransferManagerDto): Promise<User> => {
  return post<User>(`${ENDPOINT}/${userId}/transfer-manager`, dto);
};

export const batchTransferManager = (dto: BatchTransferManagerDto): Promise<BatchTransferResponse> => {
  return post<BatchTransferResponse>(`${ENDPOINT}/batch-transfer-manager`, dto);
};

export const batchDeleteUsers = (userIds: string[]): Promise<void> => {
  return remove(`${ENDPOINT}/batch`, userIds);
};
