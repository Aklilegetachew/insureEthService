import { PolicyStatus, Prisma, QuotationStatus } from '@prisma/client';

import { prisma } from '../../config/prisma.js';
import type {
  CreatePolicyFromQuotationInput,
  PolicyQuery,
  UpdatePolicyStatusInput,
} from './policy.types.js';

const policyInclude = {
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
    },
  },
  quotation: {
    select: {
      id: true,
      quotationNumber: true,
      status: true,
      customerInput: true,
      requestedCoverageAmount: true,
      finalPremium: true,
    },
  },
} as const;

const formatPolicyNumber = (year: number, sequence: number) =>
  `POL-${year}-${sequence.toString().padStart(6, '0')}`;

const addOneYear = (date: Date) => {
  const next = new Date(date);
  next.setUTCFullYear(next.getUTCFullYear() + 1);
  return next;
};

type ApprovedQuotation = NonNullable<
  Awaited<ReturnType<typeof prisma.quotation.findFirst>>
>;

export const policyRepository = {
  findApprovedQuotationById(quotationId: string) {
    return prisma.quotation.findFirst({
      where: {
        id: quotationId,
        status: QuotationStatus.APPROVED,
      },
      include: {
        product: true,
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
      },
    });
  },

  findByQuotationId(quotationId: string) {
    return prisma.policy.findUnique({
      where: { quotationId },
      include: policyInclude,
    });
  },

  async createFromQuotation(
    quotation: ApprovedQuotation,
    input: CreatePolicyFromQuotationInput,
  ) {
    const startDate = input.startDate ? new Date(input.startDate) : new Date();
    const endDate = addOneYear(startDate);
    const year = startDate.getUTCFullYear();
    const yearStart = new Date(Date.UTC(year, 0, 1));
    const nextYearStart = new Date(Date.UTC(year + 1, 0, 1));

    return prisma.$transaction(async (tx) => {
      const sequence = await tx.policy.count({
        where: {
          createdAt: {
            gte: yearStart,
            lt: nextYearStart,
          },
        },
      });

      return tx.policy.create({
        data: {
          policyNumber: formatPolicyNumber(year, sequence + 1),
          customerId: quotation.customerId,
          productId: quotation.productId,
          quotationId: quotation.id,
          status: PolicyStatus.PENDING_PAYMENT,
          coverageAmount: quotation.requestedCoverageAmount,
          premiumAmount: quotation.finalPremium,
          startDate,
          endDate,
          policyData:
            input.policyData ??
            ({
              quotationNumber: quotation.quotationNumber,
              customerInput: quotation.customerInput,
            } as Prisma.InputJsonValue),
        },
        include: policyInclude,
      });
    });
  },

  findMine(customerId: string) {
    return prisma.policy.findMany({
      where: { customerId },
      include: policyInclude,
      orderBy: { createdAt: 'desc' },
    });
  },

  findByIdForCustomer(id: string, customerId: string) {
    return prisma.policy.findFirst({
      where: { id, customerId },
      include: policyInclude,
    });
  },

  findMany(query: PolicyQuery) {
    return prisma.policy.findMany({
      where: {
        ...(query.status ? { status: query.status } : {}),
        ...(query.customerId ? { customerId: query.customerId } : {}),
        ...(query.productId ? { productId: query.productId } : {}),
        ...(query.search
          ? {
              OR: [
                { policyNumber: { contains: query.search, mode: 'insensitive' } },
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
                {
                  quotation: {
                    quotationNumber: { contains: query.search, mode: 'insensitive' },
                  },
                },
              ],
            }
          : {}),
      },
      include: policyInclude,
      orderBy: { createdAt: 'desc' },
    });
  },

  updateStatus(id: string, input: UpdatePolicyStatusInput) {
    return prisma.policy.update({
      where: { id },
      data: {
        status: input.status,
      },
      include: policyInclude,
    });
  },
};
