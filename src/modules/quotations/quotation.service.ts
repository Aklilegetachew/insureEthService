import { Prisma, QuotationStatus, UserRole } from '@prisma/client';

import { AppError } from '../../utils/app-error.js';
import type { SafeUser } from '../auth/auth.types.js';
import { quotationRepository } from './quotation.repository.js';
import type {
  CreateQuotationInput,
  QuotationDecisionInput,
  QuotationQuery,
} from './quotation.types.js';

const isStaff = (user: SafeUser) => user.role !== UserRole.CUSTOMER;

const calculatePremium = (
  requestedCoverageAmount: number,
  product: {
    basePremium: Prisma.Decimal | null;
    premiumRate: Prisma.Decimal | null;
  },
) => {
  if (product.premiumRate !== null) {
    return (requestedCoverageAmount * Number(product.premiumRate)) / 100;
  }

  if (product.basePremium !== null) {
    return Number(product.basePremium);
  }

  throw new AppError('Product does not have a premium rate or base premium configured', 422);
};

const assertCustomer = (user: SafeUser) => {
  if (user.role !== UserRole.CUSTOMER) {
    throw new AppError('Only customers can perform this quotation action', 403);
  }
};

const assertReviewable = (status: QuotationStatus) => {
  if (status !== QuotationStatus.SUBMITTED) {
    throw new AppError('Only submitted quotations can be reviewed', 422);
  }
};

const handlePrismaError = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2025') {
      throw new AppError('Quotation not found', 404);
    }

    if (error.code === 'P2002') {
      throw new AppError('Quotation number already exists, please retry', 409);
    }
  }

  throw error;
};

export const quotationService = {
  async createQuotation(user: SafeUser, input: CreateQuotationInput) {
    assertCustomer(user);

    const product = await quotationRepository.findActiveProductById(input.productId);

    if (!product) {
      throw new AppError('Active insurance product not found', 404);
    }

    const calculatedPremium = calculatePremium(input.requestedCoverageAmount, product);

    try {
      return await quotationRepository.create(user.id, input, calculatedPremium);
    } catch (error) {
      handlePrismaError(error);
    }
  },

  listMyQuotations(user: SafeUser) {
    assertCustomer(user);
    return quotationRepository.findMine(user.id);
  },

  async getMyQuotationById(user: SafeUser, quotationId: string) {
    assertCustomer(user);

    const quotation = await quotationRepository.findByIdForCustomer(quotationId, user.id);

    if (!quotation) {
      throw new AppError('Quotation not found', 404);
    }

    return quotation;
  },

  listAdminQuotations(user: SafeUser, query: QuotationQuery) {
    if (!isStaff(user)) {
      throw new AppError('You do not have permission to access this resource', 403);
    }

    return quotationRepository.findMany(query);
  },

  async approveQuotation(user: SafeUser, quotationId: string, input: QuotationDecisionInput) {
    if (!isStaff(user)) {
      throw new AppError('You do not have permission to access this resource', 403);
    }

    const quotation = await quotationRepository.findById(quotationId);

    if (!quotation) {
      throw new AppError('Quotation not found', 404);
    }

    assertReviewable(quotation.status);

    try {
      return await quotationRepository.approve(quotationId, input);
    } catch (error) {
      handlePrismaError(error);
    }
  },

  async rejectQuotation(user: SafeUser, quotationId: string, input: QuotationDecisionInput) {
    if (!isStaff(user)) {
      throw new AppError('You do not have permission to access this resource', 403);
    }

    const quotation = await quotationRepository.findById(quotationId);

    if (!quotation) {
      throw new AppError('Quotation not found', 404);
    }

    assertReviewable(quotation.status);

    try {
      return await quotationRepository.reject(quotationId, input);
    } catch (error) {
      handlePrismaError(error);
    }
  },
};
