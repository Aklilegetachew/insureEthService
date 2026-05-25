import type { PaymentMethod, PaymentStatus } from '@prisma/client';

export type CreatePaymentInput = {
  policyId: string;
  amount: number;
  method: PaymentMethod;
  proofUrl?: string;
  transactionReference?: string;
  paidAt?: string;
};

export type PaymentDecisionInput = {
  financeNote?: string;
};

export type PaymentQuery = {
  status?: PaymentStatus;
  method?: PaymentMethod;
  customerId?: string;
  policyId?: string;
  search?: string;
};
