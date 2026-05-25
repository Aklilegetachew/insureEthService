import { Prisma } from '@prisma/client';

import { AppError } from '../../../utils/app-error.js';
import { customerRepository } from './customer.repository.js';
import type { CustomerQuery } from './customer.types.js';

const toAmount = (value: Prisma.Decimal | null | undefined) => Number(value ?? 0);

const flattenCustomer = (customer: Awaited<ReturnType<typeof customerRepository.findById>>) => {
  if (!customer) return null;

  return {
    ...customer,
    policiesCount: customer._count.policies,
    claimsCount: customer._count.claims,
    totalPremiumPaid: 0,
  };
};

export const customerService = {
  async listCustomers(query: CustomerQuery) {
    const customers = await customerRepository.findMany(query);
    const sums = await customerRepository.sumVerifiedPayments(customers.map((customer) => customer.id));
    const sumMap = new Map(sums.map((item) => [item.customerId, toAmount(item._sum.amount)]));

    return customers.map((customer) => ({
      id: customer.id,
      fullName: customer.fullName,
      email: customer.email,
      phone: customer.phone,
      role: customer.role,
      status: customer.status,
      lastLoginAt: customer.lastLoginAt,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      customerProfile: customer.customerProfile,
      policiesCount: customer._count.policies,
      claimsCount: customer._count.claims,
      totalPremiumPaid: sumMap.get(customer.id) ?? 0,
    }));
  },

  async getCustomer(customerId: string) {
    const customer = await customerRepository.findById(customerId);

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    const [policies, claims, payments, documents] = await Promise.all([
      customerRepository.findPolicies(customer.id),
      customerRepository.findClaims(customer.id),
      customerRepository.findPayments(customer.id),
      customerRepository.findDocuments(customer.id, customer.customerProfile?.id),
    ]);

    const totalPremiumPaid = payments
      .filter((payment) => payment.status === 'VERIFIED')
      .reduce((sum, payment) => sum + Number(payment.amount), 0);

    const base = flattenCustomer(customer);
    if (!base) {
      throw new AppError('Customer not found', 404);
    }

    return {
      ...base,
      totalPremiumPaid,
      policies,
      claims,
      payments,
      documents,
      notes: null as string | null,
    };
  },
};

