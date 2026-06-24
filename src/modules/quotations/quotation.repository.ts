import { randomInt } from 'node:crypto';

import { Orm, PolicyStatus, ProductStatus, QuotationStatus } from '#database';

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
      termsAndConditions: true,
    },
  },
} as const;

const formatQuotationNumber = (year: number) =>
  `QUO-${year}-${randomInt(100000, 1000000)}`;

const formatPolicyNumber = (year: number, sequence: number) =>
  `POL-${year}-${sequence.toString().padStart(6, '0')}`;

const addOneYear = (date: Date) => {
  const next = new Date(date);
  next.setUTCFullYear(next.getUTCFullYear() + 1);
  return next;
};

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

    return orm.$transaction(async (tx) => {
      for (let attempt = 1; attempt <= 10; attempt += 1) {
        try {
          return await tx.quotation.create({
            data: {
              quotationNumber: formatQuotationNumber(year),
              customerId,
              productId: input.productId,
              status: QuotationStatus.SUBMITTED,
              requestedCoverageAmount: new Orm.Decimal(input.requestedCoverageAmount),
              calculatedPremium: new Orm.Decimal(calculatedPremium),
              finalPremium: new Orm.Decimal(calculatedPremium),
              customerInput: input.customerInput,
              ...(input.validUntil ? { validUntil: new Date(input.validUntil) } : {}),
            },
            include: quotationInclude,
          });
        } catch (error) {
          if (error instanceof Orm.KnownRequestError && error.code === 'P2002') {
            continue;
          }

          throw error;
        }
      }

      throw new Orm.KnownRequestError('Quotation number already exists, please retry', 'P2002');
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

  updateDecision(id: string, status: QuotationStatus, input: QuotationDecisionInput) {
    return orm.quotation.update({
      where: { id },
      data: {
        status,
        ...(input.adminNote !== undefined ? { adminNote: input.adminNote } : {}),
        ...(input.finalPremium !== undefined
          ? { finalPremium: new Orm.Decimal(input.finalPremium) }
          : {}),
        ...(input.appointmentAt ? { appointmentAt: new Date(input.appointmentAt) } : {}),
        ...(input.appointmentLocation !== undefined ? { appointmentLocation: input.appointmentLocation } : {}),
        ...(input.appointmentNote !== undefined ? { appointmentNote: input.appointmentNote } : {}),
      },
      include: quotationInclude,
    });
  },

  async finalApproveAndCreatePolicy(id: string, input: QuotationDecisionInput) {
    const now = new Date();
    const year = now.getUTCFullYear();
    const yearStart = new Date(Date.UTC(year, 0, 1));
    const nextYearStart = new Date(Date.UTC(year + 1, 0, 1));

    return orm.$transaction(async (tx) => {
      const quotation = await tx.quotation.update({
        where: { id },
        data: {
          status: QuotationStatus.APPROVED,
          ...(input.adminNote !== undefined ? { adminNote: input.adminNote } : {}),
          ...(input.finalPremium !== undefined
            ? { finalPremium: new Orm.Decimal(input.finalPremium) }
            : {}),
          appointmentAt: input.appointmentAt ? new Date(input.appointmentAt) : null,
          appointmentLocation: input.appointmentLocation ?? null,
          appointmentNote: input.appointmentNote ?? null,
        },
        include: {
          customer: true,
          product: true,
        },
      });

      const existingPolicy = await tx.policy.findUnique({
        where: { quotationId: id },
        select: { id: true },
      });

      if (!existingPolicy) {
        const sequence = await tx.policy.count({
          where: {
            createdAt: {
              gte: yearStart,
              lt: nextYearStart,
            },
          },
        });

        await tx.policy.create({
          data: {
            policyNumber: formatPolicyNumber(year, sequence + 1),
            customerId: quotation.customerId,
            productId: quotation.productId,
            quotationId: quotation.id,
            status: PolicyStatus.PENDING_PAYMENT,
            coverageAmount: quotation.requestedCoverageAmount,
            premiumAmount: quotation.finalPremium,
            startDate: now,
            endDate: addOneYear(now),
            policyData: {
              quotationNumber: quotation.quotationNumber,
              customerInput: quotation.customerInput,
              approvalFlow: 'FINANCE_MANAGER_BRANCH',
              appointment: {
                appointmentAt: input.appointmentAt,
                location: input.appointmentLocation,
                note: input.appointmentNote ?? null,
              },
            } as Orm.InputJsonValue,
          },
        });
      }

      return tx.quotation.findUnique({
        where: { id },
        include: quotationInclude,
      });
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
