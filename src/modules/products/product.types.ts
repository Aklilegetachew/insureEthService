import type { Prisma, ProductStatus } from '@prisma/client';

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
  requiredDocuments?: Prisma.InputJsonValue;
  termsAndConditions?: string;
};

export type UpdateProductInput = Partial<CreateProductInput>;
