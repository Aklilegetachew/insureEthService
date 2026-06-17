import type { Orm, QuotationStatus } from '#database';

export type CreateQuotationInput = {
  productId: string;
  requestedCoverageAmount: number;
  customerInput?: Orm.InputJsonValue;
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
