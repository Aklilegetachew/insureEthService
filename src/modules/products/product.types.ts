import type { Orm, ProductStatus } from '#database';

export type ProductQuery = {
  status?: ProductStatus;
  category?: string;
  search?: string;
};

export type CreateProductInput = {
  name: string;
  code: string;
  description?: string;
  category: string;
  status?: ProductStatus;
  basePremium?: number;
  premiumRate?: number;
  coverageDescription?: string;
  requiredDocuments?: Orm.InputJsonValue;
  termsAndConditions?: string;
};

export type UpdateProductInput = Partial<CreateProductInput>;
