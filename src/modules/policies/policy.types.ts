import type { PolicyStatus, Prisma } from '@prisma/client';

export type CreatePolicyFromQuotationInput = {
  startDate?: string;
  policyData?: Prisma.InputJsonValue;
};

export type UpdatePolicyStatusInput = {
  status: PolicyStatus;
};

export type PolicyQuery = {
  status?: PolicyStatus;
  customerId?: string;
  productId?: string;
  search?: string;
};
