import { Orm, QuotationStatus, UserRole } from '#database';

import { AppError } from '../../utils/app-error.js';
import { accessControlService } from '../access-control/access-control.service.js';
import type { PermissionKey } from '../access-control/access-control.types.js';
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
    basePremium: Orm.Decimal | null;
    premiumRate: Orm.Decimal | null;
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

const getNextApprovalStage = (status: QuotationStatus): {
  permission: PermissionKey;
  nextStatus: QuotationStatus;
  label: string;
  final?: boolean;
} => {
  if (status === QuotationStatus.SUBMITTED) {
    return {
      permission: 'quotations.finance_review',
      nextStatus: QuotationStatus.FINANCE_APPROVED,
      label: 'finance approval',
    };
  }

  if (status === QuotationStatus.FINANCE_APPROVED) {
    return {
      permission: 'quotations.manager_review',
      nextStatus: QuotationStatus.MANAGER_APPROVED,
      label: 'manager approval',
    };
  }

  if (status === QuotationStatus.MANAGER_APPROVED) {
    return {
      permission: 'quotations.branch_review',
      nextStatus: QuotationStatus.APPROVED,
      label: 'branch approval',
      final: true,
    };
  }

  throw new AppError('This quotation is not waiting for approval', 422);
};

const assertPermission = async (user: SafeUser, permission: PermissionKey) => {
  const allowed = await accessControlService.roleHasPermission(user.role, permission);

  if (!allowed) {
    throw new AppError('You do not have permission for this approval stage', 403);
  }
};

const assertAppointment = (input: QuotationDecisionInput) => {
  if (!input.appointmentAt || !input.appointmentLocation?.trim()) {
    throw new AppError('Appointment date, time, and location are required for final approval', 422);
  }

  if (new Date(input.appointmentAt).getTime() <= Date.now()) {
    throw new AppError('Appointment time must be in the future', 422);
  }
};

const handleormError = (error: unknown): never => {
  if (error instanceof Orm.KnownRequestError) {
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
      handleormError(error);
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

    const stage = getNextApprovalStage(quotation.status);
    await assertPermission(user, stage.permission);

    try {
      if (stage.final) {
        assertAppointment(input);
        return await quotationRepository.finalApproveAndCreatePolicy(quotationId, input);
      }

      return await quotationRepository.updateDecision(quotationId, stage.nextStatus, input);
    } catch (error) {
      handleormError(error);
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

    const stage = getNextApprovalStage(quotation.status);
    await assertPermission(user, stage.permission);

    try {
      return await quotationRepository.reject(quotationId, input);
    } catch (error) {
      handleormError(error);
    }
  },
};
