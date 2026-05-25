import { ClaimStatus, PaymentStatus, PolicyStatus, Prisma } from '@prisma/client';
import dayjs from 'dayjs';

import { prisma } from '../../../config/prisma.js';
import type { ReportFilters } from './reports.types.js';

const toAmount = (value: Prisma.Decimal | null | undefined) => Number(value ?? 0);

const getDateRangeStart = (dateRange?: string) => {
  const now = dayjs();

  switch (dateRange) {
    case '7d':
      return now.subtract(7, 'day').toDate();
    case '30d':
      return now.subtract(30, 'day').toDate();
    case '90d':
      return now.subtract(90, 'day').toDate();
    case 'ytd':
      return now.startOf('year').toDate();
    default:
      return null;
  }
};

const withSince = (since: Date | null) =>
  since
    ? {
        createdAt: {
          gte: since,
        },
      }
    : {};

const getPolicyWhere = (filters?: ReportFilters) => {
  const since = getDateRangeStart(filters?.dateRange);
  return {
    ...withSince(since),
    ...(filters?.productId ? { productId: filters.productId } : {}),
  };
};

const getPaymentWhere = (filters?: ReportFilters) => {
  const since = getDateRangeStart(filters?.dateRange);
  return {
    ...withSince(since),
    ...(filters?.productId
      ? {
          policy: {
            is: {
              productId: filters.productId,
            },
          },
        }
      : {}),
  };
};

const getClaimWhere = (filters?: ReportFilters) => {
  const since = getDateRangeStart(filters?.dateRange);
  return {
    ...withSince(since),
    ...(filters?.productId
      ? {
          policy: {
            is: {
              productId: filters.productId,
            },
          },
        }
      : {}),
  };
};

const getQuotationWhere = (filters?: ReportFilters) => {
  const since = getDateRangeStart(filters?.dateRange);
  return {
    ...withSince(since),
    ...(filters?.productId ? { productId: filters.productId } : {}),
  };
};

const monthLabel = (date: Date) => dayjs(date).format('MMM');

export const reportsService = {
  async getSummary(filters?: ReportFilters) {
    const since = getDateRangeStart(filters?.dateRange);
    const policyWhere = getPolicyWhere(filters);
    const paymentWhere = getPaymentWhere(filters);
    const claimWhere = getClaimWhere(filters);
    const quotationWhere = getQuotationWhere(filters);

    const [
      totalCustomers,
      activePolicies,
      pendingClaims,
      pendingPayments,
      premiumCollected,
      claimPayout,
      pendingQuotations,
      documentsPendingReview,
      payments,
      claims,
      policies,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.policy.count({ where: { status: PolicyStatus.ACTIVE, ...policyWhere } }),
      prisma.claim.count({
        where: {
          ...claimWhere,
          status: {
            in: [
              ClaimStatus.SUBMITTED,
              ClaimStatus.DOCUMENT_REVIEW,
              ClaimStatus.MORE_INFO_REQUIRED,
              ClaimStatus.ASSIGNED_TO_ASSESSOR,
              ClaimStatus.ASSESSMENT_COMPLETED,
              ClaimStatus.PENDING_APPROVAL,
              ClaimStatus.SETTLEMENT_PROCESSING,
            ],
          },
        },
      }),
      prisma.payment.count({ where: { status: PaymentStatus.PENDING, ...paymentWhere } }),
      prisma.payment.aggregate({
        where: {
          status: PaymentStatus.VERIFIED,
          ...paymentWhere,
        },
        _sum: {
          amount: true,
        },
      }),
      prisma.claim.aggregate({
        where: {
          ...claimWhere,
          status: {
            in: [ClaimStatus.APPROVED, ClaimStatus.SETTLEMENT_PROCESSING, ClaimStatus.SETTLED, ClaimStatus.CLOSED],
          },
        },
        _sum: {
          approvedAmount: true,
        },
      }),
      prisma.quotation.count({
        where: {
          ...quotationWhere,
          status: 'SUBMITTED',
        },
      }),
      prisma.document.count({
        where: {
          status: 'PENDING_REVIEW',
          ...(since ? { createdAt: { gte: since } } : {}),
        },
      }),
      prisma.payment.findMany({
        where: paymentWhere,
        select: {
          createdAt: true,
          amount: true,
        },
      }),
      prisma.claim.findMany({
        where: claimWhere,
        select: {
          status: true,
          estimatedAmount: true,
        },
      }),
      prisma.policy.findMany({
        where: policyWhere,
        select: {
          productId: true,
          createdAt: true,
        },
      }),
    ]);

    const monthlyRevenueMap = new Map<string, number>();
    payments.forEach((payment) => {
      const label = monthLabel(payment.createdAt);
      monthlyRevenueMap.set(label, (monthlyRevenueMap.get(label) ?? 0) + toAmount(payment.amount));
    });

    const claimStatusMap = new Map<string, number>();
    claims.forEach((claim) => {
      claimStatusMap.set(claim.status, (claimStatusMap.get(claim.status) ?? 0) + 1);
    });

    const policyProductMap = new Map<string, number>();
    policies.forEach((policy) => {
      policyProductMap.set(policy.productId, (policyProductMap.get(policy.productId) ?? 0) + 1);
    });

    const paymentMethodAgg = await prisma.payment.groupBy({
      by: ['method'],
      where: paymentWhere,
      _count: {
        method: true,
      },
    });

    const productRows = await prisma.insuranceProduct.findMany({
      ...(filters?.productId ? { where: { id: filters.productId } } : {}),
      select: {
        id: true,
        name: true,
        category: true,
      },
    });

    const productLabelMap = new Map(productRows.map((product) => [product.id, product.name]));

    const recentClaims = await prisma.claim.findMany({
      where: claimWhere,
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
          },
        },
        policy: {
          select: {
            id: true,
            policyNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const recentPayments = await prisma.payment.findMany({
      where: paymentWhere,
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
          },
        },
        policy: {
          select: {
            id: true,
            policyNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const expiringPolicies = await prisma.policy.findMany({
      where: {
        status: PolicyStatus.ACTIVE,
        endDate: {
          lte: dayjs().add(30, 'day').toDate(),
          gte: dayjs().toDate(),
        },
        ...(filters?.productId ? { productId: filters.productId } : {}),
      },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { endDate: 'asc' },
      take: 10,
    });

    const monthLabels = Array.from({ length: 6 }, (_value, index) =>
      dayjs().subtract(5 - index, 'month').format('MMM'),
    );

    return {
      kpis: {
        totalCustomers,
        activePolicies,
        pendingClaims,
        pendingPayments,
        premiumCollected: toAmount(premiumCollected._sum.amount),
        claimPayout: toAmount(claimPayout._sum.approvedAmount),
      },
      queues: {
        pendingQuotations,
        pendingPayments,
        claimsNeedingReview: pendingClaims,
        documentsPendingReview,
      },
      charts: {
        monthlyPremiumRevenue: monthLabels.map((label) => ({
          label,
          value: monthlyRevenueMap.get(label) ?? 0,
        })),
        claimsByStatus: Object.values(ClaimStatus).map((status) => ({
          label: status.replaceAll('_', ' '),
          value: claimStatusMap.get(status) ?? 0,
        })),
        policiesByProduct: Array.from(policyProductMap.entries()).map(([productId, value]) => ({
          label: productLabelMap.get(productId) ?? productId,
          value,
        })),
        paymentsByMethod: paymentMethodAgg.map((item) => ({
          label: item.method.replaceAll('_', ' '),
          value: item._count.method,
        })),
      },
      recentClaims: recentClaims.map((claim) => ({
        id: claim.id,
        claimNumber: claim.claimNumber,
        customerName: claim.customer.fullName,
        policyNumber: claim.policy.policyNumber,
        status: claim.status,
        amount: toAmount(claim.estimatedAmount),
        createdAt: claim.createdAt.toISOString(),
      })),
      recentPayments: recentPayments.map((payment) => ({
        id: payment.id,
        paymentReference: payment.paymentReference,
        customerName: payment.customer.fullName,
        policyNumber: payment.policy.policyNumber,
        status: payment.status,
        amount: toAmount(payment.amount),
        method: payment.method,
        createdAt: payment.createdAt.toISOString(),
      })),
      expiringPolicies: expiringPolicies.map((policy) => ({
        id: policy.id,
        policyNumber: policy.policyNumber,
        customerName: policy.customer.fullName,
        productName: policy.product.name,
        endDate: policy.endDate.toISOString(),
        daysRemaining: Math.max(0, dayjs(policy.endDate).diff(dayjs(), 'day')),
      })),
    };
  },

  async listPolicies(filters?: ReportFilters) {
    const policyWhere = getPolicyWhere(filters);
    const rows = await prisma.policy.findMany({
      where: policyWhere,
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            code: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return rows.map((policy) => ({
      id: policy.id,
      label: policy.policyNumber,
      status: policy.status,
      customerName: policy.customer.fullName,
      policyNumber: policy.policyNumber,
      amount: toAmount(policy.coverageAmount),
      createdAt: policy.createdAt.toISOString(),
    }));
  },

  async listClaims(filters?: ReportFilters) {
    const claimWhere = getClaimWhere(filters);
    const rows = await prisma.claim.findMany({
      where: claimWhere,
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
          },
        },
        policy: {
          select: {
            id: true,
            policyNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return rows.map((claim) => ({
      id: claim.id,
      label: claim.claimNumber,
      status: claim.status,
      customerName: claim.customer.fullName,
      policyNumber: claim.policy.policyNumber,
      amount: toAmount(claim.estimatedAmount),
      createdAt: claim.createdAt.toISOString(),
    }));
  },

  async listPayments(filters?: ReportFilters) {
    const paymentWhere = getPaymentWhere(filters);
    const rows = await prisma.payment.findMany({
      where: paymentWhere,
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
          },
        },
        policy: {
          select: {
            id: true,
            policyNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return rows.map((payment) => ({
      id: payment.id,
      label: payment.paymentReference,
      status: payment.status,
      customerName: payment.customer.fullName,
      policyNumber: payment.policy.policyNumber,
      amount: toAmount(payment.amount),
      method: payment.method,
      createdAt: payment.createdAt.toISOString(),
    }));
  },
};
