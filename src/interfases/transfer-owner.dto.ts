export interface TransferOwnerDto {
  newOwnerId: string;
}

export interface BatchTransferDto {
  userIds: string[];
  newOwnerId: string;
}

export interface TransferManagerDto {
  newManagerId: string;
}

export interface BatchTransferManagerDto {
  userIds: string[];
  newManagerId: string;
}

export interface BatchTransferResponse {
  transferred: number;
  failed: Array<{ userId: string; reason: string }>;
}
