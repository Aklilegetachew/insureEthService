import { Prisma, ProductStatus, QuotationStatus } from '@prisma/client';

import { prisma } from '../../config/prisma.js';
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
    return prisma.insuranceProduct.findFirst({
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

    return prisma.$transaction(async (tx) => {
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
          requestedCoverageAmount: new Prisma.Decimal(input.requestedCoverageAmount),
          calculatedPremium: new Prisma.Decimal(calculatedPremium),
          finalPremium: new Prisma.Decimal(calculatedPremium),
          ...(input.customerInput !== undefined ? { customerInput: input.customerInput } : {}),
          ...(input.validUntil ? { validUntil: new Date(input.validUntil) } : {}),
        },
        include: quotationInclude,
      });
    });
  },

  findMine(customerId: string) {
    return prisma.quotation.findMany({
      where: { customerId },
      include: quotationInclude,
      orderBy: { createdAt: 'desc' },
    });
  },

  findByIdForCustomer(id: string, customerId: string) {
    return prisma.quotation.findFirst({
      where: { id, customerId },
      include: quotationInclude,
    });
  },

  findById(id: string) {
    return prisma.quotation.findUnique({
      where: { id },
      include: quotationInclude,
    });
  },

  findMany(query: QuotationQuery) {
    return prisma.quotation.findMany({
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
    return prisma.quotation.update({
      where: { id },
      data: {
        status: QuotationStatus.APPROVED,
        ...(input.adminNote !== undefined ? { adminNote: input.adminNote } : {}),
        ...(input.finalPremium !== undefined
          ? { finalPremium: new Prisma.Decimal(input.finalPremium) }
          : {}),
      },
      include: quotationInclude,
    });
  },

  reject(id: string, input: QuotationDecisionInput) {
    return prisma.quotation.update({
      where: { id },
      data: {
        status: QuotationStatus.REJECTED,
        ...(input.adminNote !== undefined ? { adminNote: input.adminNote } : {}),
      },
      include: quotationInclude,
    });
  },
};
