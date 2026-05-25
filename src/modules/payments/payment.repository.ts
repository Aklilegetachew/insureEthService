import { PaymentStatus, PolicyStatus, Prisma } from '@prisma/client';

import { prisma } from '../../config/prisma.js';
import type {
  CreatePaymentInput,
  PaymentDecisionInput,
  PaymentQuery,
} from './payment.types.js';

const paymentInclude = {
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
  policy: {
    select: {
      id: true,
      policyNumber: true,
      status: true,
      premiumAmount: true,
      coverageAmount: true,
      product: {
        select: {
          id: true,
          name: true,
          code: true,
          category: true,
        },
      },
    },
  },
} as const;

const formatPaymentReference = (year: number, sequence: number) =>
  `PAY-${year}-${sequence.toString().padStart(6, '0')}`;

export const paymentRepository = {
  findPolicyForCustomer(policyId: string, customerId: string) {
    return prisma.policy.findFirst({
      where: {
        id: policyId,
        customerId,
      },
      select: {
        id: true,
        customerId: true,
        premiumAmount: true,
      },
    });
  },

  async create(customerId: string, input: CreatePaymentInput) {
    const now = new Date();
    const year = now.getUTCFullYear();
    const yearStart = new Date(Date.UTC(year, 0, 1));
    const nextYearStart = new Date(Date.UTC(year + 1, 0, 1));

    return prisma.$transaction(async (tx) => {
      const sequence = await tx.payment.count({
        where: {
          createdAt: {
            gte: yearStart,
            lt: nextYearStart,
          },
        },
      });

      return tx.payment.create({
        data: {
          paymentReference: formatPaymentReference(year, sequence + 1),
          customerId,
          policyId: input.policyId,
          amount: new Prisma.Decimal(input.amount),
          method: input.method,
          status: PaymentStatus.PENDING,
          ...(input.proofUrl !== undefined ? { proofUrl: input.proofUrl } : {}),
          ...(input.transactionReference !== undefined
            ? { transactionReference: input.transactionReference }
            : {}),
          paidAt: input.paidAt ? new Date(input.paidAt) : now,
        },
        include: paymentInclude,
      });
    });
  },

  findMine(customerId: string) {
    return prisma.payment.findMany({
      where: { customerId },
      include: paymentInclude,
      orderBy: { createdAt: 'desc' },
    });
  },

  findById(id: string) {
    return prisma.payment.findUnique({
      where: { id },
      include: paymentInclude,
    });
  },

  findMany(query: PaymentQuery) {
    return prisma.payment.findMany({
      where: {
        ...(query.status ? { status: query.status } : {}),
        ...(query.method ? { method: query.method } : {}),
        ...(query.customerId ? { customerId: query.customerId } : {}),
        ...(query.policyId ? { policyId: query.policyId } : {}),
        ...(query.search
          ? {
              OR: [
                { paymentReference: { contains: query.search, mode: 'insensitive' } },
                {
                  transactionReference: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
                {
                  customer: {
                    fullName: { contains: query.search, mode: 'insensitive' },
                  },
                },
                {
                  policy: {
                    policyNumber: { contains: query.search, mode: 'insensitive' },
                  },
                },
              ],
            }
          : {}),
      },
      include: paymentInclude,
      orderBy: { createdAt: 'desc' },
    });
  },

  verify(id: string, input: PaymentDecisionInput) {
    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.update({
        where: { id },
        data: {
          status: PaymentStatus.VERIFIED,
          verifiedAt: new Date(),
          ...(input.financeNote !== undefined ? { financeNote: input.financeNote } : {}),
        },
        include: paymentInclude,
      });

      await tx.policy.update({
        where: { id: payment.policyId },
        data: {
          status: PolicyStatus.ACTIVE,
        },
      });

      return payment;
    });
  },

  reject(id: string, input: PaymentDecisionInput) {
    return prisma.payment.update({
      where: { id },
      data: {
        status: PaymentStatus.REJECTED,
        ...(input.financeNote !== undefined ? { financeNote: input.financeNote } : {}),
      },
      include: paymentInclude,
    });
  },
};
