import { ProductStatus, Orm } from '#database';

import { orm } from '../../config/orm.js';
import type { CreateProductInput, ProductQuery, UpdateProductInput } from './product.types.js';

const productSelect = {
  id: true,
  name: true,
  code: true,
  description: true,
  category: true,
  status: true,
  basePremium: true,
  premiumRate: true,
  coverageDescription: true,
  requiredDocuments: true,
  termsAndConditions: true,
  createdAt: true,
  updatedAt: true,
} as const;

const toProductData = (input: CreateProductInput | UpdateProductInput) => ({
  ...(input.name !== undefined ? { name: input.name } : {}),
  ...(input.code !== undefined ? { code: input.code } : {}),
  ...(input.description !== undefined ? { description: input.description } : {}),
  ...(input.category !== undefined ? { category: input.category } : {}),
  ...(input.status !== undefined ? { status: input.status } : {}),
  ...(input.basePremium !== undefined ? { basePremium: new Orm.Decimal(input.basePremium) } : {}),
  ...(input.premiumRate !== undefined ? { premiumRate: new Orm.Decimal(input.premiumRate) } : {}),
  ...(input.coverageDescription !== undefined
    ? { coverageDescription: input.coverageDescription }
    : {}),
  ...(input.requiredDocuments !== undefined
    ? { requiredDocuments: input.requiredDocuments }
    : {}),
  ...(input.termsAndConditions !== undefined
    ? { termsAndConditions: input.termsAndConditions }
    : {}),
});

export const productRepository = {
  findMany(query: ProductQuery, activeOnly: boolean) {
    const where: Orm.InsuranceProductWhereInput = {
      ...(activeOnly ? { status: ProductStatus.ACTIVE } : {}),
      ...(!activeOnly && query.status ? { status: query.status } : {}),
      ...(query.category ? { category: { equals: query.category, mode: 'insensitive' } } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { code: { contains: query.search, mode: 'insensitive' } },
              { category: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    return orm.insuranceProduct.findMany({
      where,
      select: productSelect,
      orderBy: { createdAt: 'desc' },
    });
  },

  findById(id: string, activeOnly: boolean) {
    return orm.insuranceProduct.findFirst({
      where: {
        id,
        ...(activeOnly ? { status: ProductStatus.ACTIVE } : {}),
      },
      select: productSelect,
    });
  },

  findByCode(code: string) {
    return orm.insuranceProduct.findUnique({
      where: { code },
      select: { id: true, code: true },
    });
  },

  create(input: CreateProductInput) {
    return orm.insuranceProduct.create({
      data: toProductData(input) as Orm.InsuranceProductCreateInput,
      select: productSelect,
    });
  },

  update(id: string, input: UpdateProductInput) {
    return orm.insuranceProduct.update({
      where: { id },
      data: toProductData(input) as Orm.InsuranceProductUpdateInput,
      select: productSelect,
    });
  },

  delete(id: string) {
    return orm.insuranceProduct.delete({
      where: { id },
      select: productSelect,
    });
  },
};
