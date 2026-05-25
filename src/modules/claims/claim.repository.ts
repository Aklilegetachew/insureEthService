import { ClaimStatus, PolicyStatus, Prisma } from '@prisma/client';

import { prisma } from '../../config/prisma.js';
import type {
  ApproveClaimInput,
  ClaimQuery,
  CreateClaimInput,
  RejectClaimInput,
  UpdateClaimStatusInput,
} from './claim.types.js';

const claimInclude = {
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
      coverageAmount: true,
      premiumAmount: true,
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

const formatClaimNumber = (year: number, sequence: number) =>
  `CLM-${year}-${sequence.toString().padStart(6, '0')}`;

export const claimRepository = {
  findActivePolicyForCustomer(policyId: string, customerId: string) {
    return prisma.policy.findFirst({
      where: {
        id: policyId,
        customerId,
        status: PolicyStatus.ACTIVE,
      },
      select: {
        id: true,
        customerId: true,
      },
    });
  },

  async create(customerId: string, input: CreateClaimInput) {
    const now = new Date();
    const year = now.getUTCFullYear();
    const yearStart = new Date(Date.UTC(year, 0, 1));
    const nextYearStart = new Date(Date.UTC(year + 1, 0, 1));

    return prisma.$transaction(async (tx) => {
      const sequence = await tx.claim.count({
        where: {
          createdAt: {
            gte: yearStart,
            lt: nextYearStart,
          },
        },
      });

      return tx.claim.create({
        data: {
          claimNumber: formatClaimNumber(year, sequence + 1),
          customerId,
          policyId: input.policyId,
          claimType: input.claimType,
          incidentDate: new Date(input.incidentDate),
          incidentLocation: input.incidentLocation,
          description: input.description,
          estimatedAmount: new Prisma.Decimal(input.estimatedAmount),
          status: ClaimStatus.SUBMITTED,
        },
        include: claimInclude,
      });
    });
  },

  findMine(customerId: string) {
    return prisma.claim.findMany({
      where: { customerId },
      include: claimInclude,
      orderBy: { createdAt: 'desc' },
    });
  },

  findByIdForCustomer(id: string, customerId: string) {
    return prisma.claim.findFirst({
      where: { id, customerId },
      include: claimInclude,
    });
  },

  findById(id: string) {
    return prisma.claim.findUnique({
      where: { id },
      include: claimInclude,
    });
  },

  findMany(query: ClaimQuery) {
    return prisma.claim.findMany({
      where: {
        ...(query.status ? { status: query.status } : {}),
        ...(query.customerId ? { customerId: query.customerId } : {}),
        ...(query.policyId ? { policyId: query.policyId } : {}),
        ...(query.search
          ? {
              OR: [
                { claimNumber: { contains: query.search, mode: 'insensitive' } },
                { claimType: { contains: query.search, mode: 'insensitive' } },
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
      include: claimInclude,
      orderBy: { createdAt: 'desc' },
    });
  },

  updateStatus(id: string, input: UpdateClaimStatusInput) {
    return prisma.claim.update({
      where: { id },
      data: {
        status: input.status,
        ...(input.adminNote !== undefined ? { adminNote: input.adminNote } : {}),
      },
      include: claimInclude,
    });
  },

  approve(id: string, input: ApproveClaimInput) {
    return prisma.claim.update({
      where: { id },
      data: {
        status: ClaimStatus.APPROVED,
        approvedAmount: new Prisma.Decimal(input.approvedAmount),
        ...(input.adminNote !== undefined ? { adminNote: input.adminNote } : {}),
        rejectionReason: null,
      },
      include: claimInclude,
    });
  },

  reject(id: string, input: RejectClaimInput) {
    return prisma.claim.update({
      where: { id },
      data: {
        status: ClaimStatus.REJECTED,
        rejectionReason: input.rejectionReason,
        ...(input.adminNote !== undefined ? { adminNote: input.adminNote } : {}),
      },
      include: claimInclude,
    });
  },
};
