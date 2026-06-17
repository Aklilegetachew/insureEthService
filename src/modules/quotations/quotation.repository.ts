import { Orm, ProductStatus, QuotationStatus } from '#database';

import { orm } from '../../config/orm.js';
import type {
  CreateQuotationInput,
  QuotationDecisionInput,
  QuotationQuery,
} from './quotation.types.js';

const quotationInclude = {
  customer: {
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      status: true,
    },
  },
  product: {
    select: {
      id: true,
      name: true,
      code: true,
      category: true,
      status: true,
      basePremium: true,
      premiumRate: true,
    },
  },
} as const;

const formatQuotationNumber = (year: number, sequence: number) =>
  `QUO-${year}-${sequence.toString().padStart(6, '0')}`;

export const quotationRepository = {
  findActiveProductById(productId: string) {
    return orm.insuranceProduct.findFirst({
      where: {
        id: productId,
        status: ProductStatus.ACTIVE,
      },
      select: {
        id: true,
        basePremium: true,
        premiumRate: true,
      },
    });
  },

  async create(
    customerId: string,
    input: CreateQuotationInput,
    calculatedPremium: number,
  ) {
    const now = new Date();
    const year = now.getUTCFullYear();
    const yearStart = new Date(Date.UTC(year, 0, 1));
    const nextYearStart = new Date(Date.UTC(year + 1, 0, 1));

    return orm.$transaction(async (tx) => {
      const sequence = await tx.quotation.count({
        where: {
          createdAt: {
            gte: yearStart,
            lt: nextYearStart,
          },
        },
      });

      return tx.quotation.create({
        data: {
          quotationNumber: formatQuotationNumber(year, sequence + 1),
          customerId,
          productId: input.productId,
          status: QuotationStatus.SUBMITTED,
          requestedCoverageAmount: new Orm.Decimal(input.requestedCoverageAmount),
          calculatedPremium: new Orm.Decimal(calculatedPremium),
          finalPremium: new Orm.Decimal(calculatedPremium),
          ...(input.customerInput !== undefined ? { customerInput: input.customerInput } : {}),
          ...(input.validUntil ? { validUntil: new Date(input.validUntil) } : {}),
        },
        include: quotationInclude,
      });
    });
  },

  findMine(customerId: string) {
    return orm.quotation.findMany({
      where: { customerId },
      include: quotationInclude,
      orderBy: { createdAt: 'desc' },
    });
  },

  findByIdForCustomer(id: string, customerId: string) {
    return orm.quotation.findFirst({
      where: { id, customerId },
      include: quotationInclude,
    });
  },

  findById(id: string) {
    return orm.quotation.findUnique({
      where: { id },
      include: quotationInclude,
    });
  },

  findMany(query: QuotationQuery) {
    return orm.quotation.findMany({
      where: {
        ...(query.status ? { status: query.status } : {}),
        ...(query.customerId ? { customerId: query.customerId } : {}),
        ...(query.productId ? { productId: query.productId } : {}),
        ...(query.search
          ? {
              OR: [
                { quotationNumber: { contains: query.search, mode: 'insensitive' } },
                {
                  customer: {
                    fullName: { contains: query.search, mode: 'insensitive' },
                  },
                },
                {
                  product: {
                    name: { contains: query.search, mode: 'insensitive' },
                  },
                },
              ],
            }
          : {}),
      },
      include: quotationInclude,
      orderBy: { createdAt: 'desc' },
    });
  },

  approve(id: string, input: QuotationDecisionInput) {
    return orm.quotation.update({
      where: { id },
      data: {
        status: QuotationStatus.APPROVED,
        ...(input.adminNote !== undefined ? { adminNote: input.adminNote } : {}),
        ...(input.finalPremium !== undefined
          ? { finalPremium: new Orm.Decimal(input.finalPremium) }
          : {}),
      },
      include: quotationInclude,
    });
  },

  reject(id: string, input: QuotationDecisionInput) {
    return orm.quotation.update({
      where: { id },
      data: {
        status: QuotationStatus.REJECTED,
        ...(input.adminNote !== undefined ? { adminNote: input.adminNote } : {}),
      },
      include: quotationInclude,
    });
  },
};
