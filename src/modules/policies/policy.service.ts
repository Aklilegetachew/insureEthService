import { Prisma, UserRole } from '@prisma/client';

import { AppError } from '../../utils/app-error.js';
import type { SafeUser } from '../auth/auth.types.js';
import { policyRepository } from './policy.repository.js';
import type {
  CreatePolicyFromQuotationInput,
  PolicyQuery,
  UpdatePolicyStatusInput,
} from './policy.types.js';

const isStaff = (user: SafeUser) => user.role !== UserRole.CUSTOMER;

const assertCustomer = (user: SafeUser) => {
  if (user.role !== UserRole.CUSTOMER) {
    throw new AppError('Only customers can perform this policy action', 403);
  }
};

const assertStaff = (user: SafeUser) => {
  if (!isStaff(user)) {
    throw new AppError('You do not have permission to access this resource', 403);
  }
};

const handlePrismaError = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2025') {
      throw new AppError('Policy not found', 404);
    }

    if (error.code === 'P2002') {
      throw new AppError('Policy already exists for this quotation', 409);
    }
  }

  throw error;
};

export const policyService = {
  listMyPolicies(user: SafeUser) {
    assertCustomer(user);
    return policyRepository.findMine(user.id);
  },

  async getMyPolicyById(user: SafeUser, policyId: string) {
    assertCustomer(user);

    const policy = await policyRepository.findByIdForCustomer(policyId, user.id);

    if (!policy) {
      throw new AppError('Policy not found', 404);
    }

    return policy;
  },

  listAdminPolicies(user: SafeUser, query: PolicyQuery) {
    assertStaff(user);
    return policyRepository.findMany(query);
  },

  async createPolicyFromQuotation(
    user: SafeUser,
    quotationId: string,
    input: CreatePolicyFromQuotationInput,
  ) {
    assertStaff(user);

    const quotation = await policyRepository.findApprovedQuotationById(quotationId);

    if (!quotation) {
      throw new AppError('Approved quotation not found', 404);
    }

    const existingPolicy = await policyRepository.findByQuotationId(quotationId);

    if (existingPolicy) {
      throw new AppError('A policy already exists for this quotation', 409);
    }

    try {
      return await policyRepository.createFromQuotation(quotation, input);
    } catch (error) {
      handlePrismaError(error);
    }
  },

  async updatePolicyStatus(
    user: SafeUser,
    policyId: string,
    input: UpdatePolicyStatusInput,
  ) {
    assertStaff(user);

    try {
      return await policyRepository.updateStatus(policyId, input);
    } catch (error) {
      handlePrismaError(error);
    }
  },
};
