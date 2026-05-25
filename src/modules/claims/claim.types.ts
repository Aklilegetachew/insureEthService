import type { ClaimStatus } from '@prisma/client';

export type CreateClaimInput = {
  policyId: string;
  claimType: string;
  incidentDate: string;
  incidentLocation: string;
  description: string;
  estimatedAmount: number;
};

export type UpdateClaimStatusInput = {
  status: ClaimStatus;
  adminNote?: string;
};

export type ApproveClaimInput = {
  approvedAmount: number;
  adminNote?: string;
};

export type RejectClaimInput = {
  rejectionReason: string;
  adminNote?: string;
};

export type ClaimQuery = {
  status?: ClaimStatus;
  customerId?: string;
  policyId?: string;
  search?: string;
};
