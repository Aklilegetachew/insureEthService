import type { PolicyStatus, Orm } from '#database';

export type CreatePolicyFromQuotationInput = {
  startDate?: string;
  policyData?: Orm.InputJsonValue;
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
