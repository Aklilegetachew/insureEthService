import { PaymentStatus, Orm, UserRole } from '#database';

import { AppError } from '../../utils/app-error.js';
import type { SafeUser } from '../auth/auth.types.js';
import { paymentRepository } from './payment.repository.js';
import type {
  CreatePaymentInput,
  PaymentDecisionInput,
  PaymentQuery,
} from './payment.types.js';

const isStaff = (user: SafeUser) => user.role !== UserRole.CUSTOMER;

const assertCustomer = (user: SafeUser) => {
  if (user.role !== UserRole.CUSTOMER) {
    throw new AppError('Only customers can perform this payment action', 403);
  }
};

const assertStaff = (user: SafeUser) => {
  if (!isStaff(user)) {
    throw new AppError('You do not have permission to access this resource', 403);
  }
};

const assertPending = (status: PaymentStatus) => {
  if (status !== PaymentStatus.PENDING) {
    throw new AppError('Only pending payments can be reviewed', 422);
  }
};

const handleormError = (error: unknown): never => {
  if (error instanceof Orm.KnownRequestError) {
    if (error.code === 'P2025') {
      throw new AppError('Payment not found', 404);
    }

    if (error.code === 'P2002') {
      throw new AppError('Payment reference already exists, please retry', 409);
    }
  }

  throw error;
};

export const paymentService = {
  async createPayment(user: SafeUser, input: CreatePaymentInput) {
    assertCustomer(user);

    const policy = await paymentRepository.findPolicyForCustomer(input.policyId, user.id);

    if (!policy) {
      throw new AppError('Policy not found', 404);
    }

    if (!new Orm.Decimal(input.amount).equals(policy.premiumAmount)) {
      throw new AppError('Payment amount must match the policy premium amount', 422);
    }

    try {
      return await paymentRepository.create(user.id, input);
    } catch (error) {
      handleormError(error);
    }
  },

  listMyPayments(user: SafeUser) {
    assertCustomer(user);
    return paymentRepository.findMine(user.id);
  },

  listAdminPayments(user: SafeUser, query: PaymentQuery) {
    assertStaff(user);
    return paymentRepository.findMany(query);
  },

  async verifyPayment(user: SafeUser, paymentId: string, input: PaymentDecisionInput) {
    assertStaff(user);

    const payment = await paymentRepository.findById(paymentId);

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    assertPending(payment.status);

    try {
      return await paymentRepository.verify(paymentId, input);
    } catch (error) {
      handleormError(error);
    }
  },

  async rejectPayment(user: SafeUser, paymentId: string, input: PaymentDecisionInput) {
    assertStaff(user);

    const payment = await paymentRepository.findById(paymentId);

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    assertPending(payment.status);

    try {
      return await paymentRepository.reject(paymentId, input);
    } catch (error) {
      handleormError(error);
    }
  },
};
