import type { Prisma, QuotationStatus } from '@prisma/client';

export type CreateQuotationInput = {
  productId: string;
  requestedCoverageAmount: number;
  customerInput?: Prisma.InputJsonValue;
  validUntil?: string;
};

export type QuotationDecisionInput = {
  adminNote?: string;
  finalPremium?: number;
};

export type QuotationQuery = {
  status?: QuotationStatus;
  customerId?: string;
  productId?: string;
  search?: string;
};
