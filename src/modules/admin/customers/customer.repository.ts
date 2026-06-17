import { DocumentOwnerType, PaymentStatus, UserRole } from '#database';

import { orm } from '../../../config/orm.js';
import type { CustomerQuery } from './customer.types.js';

const customerSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  role: true,
  status: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  customerProfile: {
    select: {
      id: true,
      nationalId: true,
      address: true,
      dateOfBirth: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  _count: {
    select: {
      policies: true,
      claims: true,
      payments: true,
      documents: true,
    },
  },
} as const;

const customerWhere = (query: CustomerQuery) => ({
  role: UserRole.CUSTOMER,
  ...(query.status ? { status: query.status } : {}),
  ...(query.search
    ? {
        OR: [
          { fullName: { contains: query.search, mode: 'insensitive' as const } },
          { email: { contains: query.search, mode: 'insensitive' as const } },
          { phone: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }
    : {}),
});

export const customerRepository = {
  findMany(query: CustomerQuery) {
    return orm.user.findMany({
      where: customerWhere(query),
      select: customerSelect,
      orderBy: { createdAt: 'desc' },
    });
  },

  findById(id: string) {
    return orm.user.findFirst({
      where: {
        id,
        role: UserRole.CUSTOMER,
      },
      select: customerSelect,
    });
  },

  findPolicies(customerId: string) {
    return orm.policy.findMany({
      where: { customerId },
      include: {
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
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  findClaims(customerId: string) {
    return orm.claim.findMany({
      where: { customerId },
      include: {
        policy: {
          select: {
            id: true,
            policyNumber: true,
            status: true,
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
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  findPayments(customerId: string) {
    return orm.payment.findMany({
      where: { customerId },
      include: {
        policy: {
          select: {
            id: true,
            policyNumber: true,
            premiumAmount: true,
            status: true,
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
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  findDocuments(customerId: string, profileId?: string | null) {
    return orm.document.findMany({
      where: {
        ownerType: DocumentOwnerType.CUSTOMER,
        OR: [
          { ownerId: customerId },
          ...(profileId ? [{ ownerId: profileId }] : []),
        ],
      },
      include: {
        uploadedBy: {
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
      orderBy: { createdAt: 'desc' },
    });
  },

  sumVerifiedPayments(customerIds: string[]) {
    return orm.payment.groupBy({
      by: ['customerId'],
      where: {
        customerId: { in: customerIds },
        status: PaymentStatus.VERIFIED,
      },
      _sum: {
        amount: true,
      },
    });
  },
};
