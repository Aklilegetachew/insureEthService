import { Orm, UserRole } from '#database';

import { AppError } from '../../utils/app-error.js';
import type { SafeUser } from '../auth/auth.types.js';
import { claimRepository } from './claim.repository.js';
import type {
  ApproveClaimInput,
  ClaimQuery,
  CreateClaimInput,
  RejectClaimInput,
  UpdateClaimStatusInput,
} from './claim.types.js';

const isStaff = (user: SafeUser) => user.role !== UserRole.CUSTOMER;

const assertCustomer = (user: SafeUser) => {
  if (user.role !== UserRole.CUSTOMER) {
    throw new AppError('Only customers can perform this claim action', 403);
  }
};

const assertStaff = (user: SafeUser) => {
  if (!isStaff(user)) {
    throw new AppError('You do not have permission to access this resource', 403);
  }
};

const handleormError = (error: unknown): never => {
  if (error instanceof Orm.KnownRequestError) {
    if (error.code === 'P2025') {
      throw new AppError('Claim not found', 404);
    }

    if (error.code === 'P2002') {
      throw new AppError('Claim number already exists, please retry', 409);
    }
  }

  throw error;
};

export const claimService = {
  async createClaim(user: SafeUser, input: CreateClaimInput) {
    assertCustomer(user);

    const policy = await claimRepository.findActivePolicyForCustomer(input.policyId, user.id);

    if (!policy) {
      throw new AppError('Active policy not found', 404);
    }

    try {
      return await claimRepository.create(user.id, input);
    } catch (error) {
      handleormError(error);
    }
  },

  listMyClaims(user: SafeUser) {
    assertCustomer(user);
    return claimRepository.findMine(user.id);
  },

  async getMyClaimById(user: SafeUser, claimId: string) {
    assertCustomer(user);

    const claim = await claimRepository.findByIdForCustomer(claimId, user.id);

    if (!claim) {
      throw new AppError('Claim not found', 404);
    }

    return claim;
  },

  listAdminClaims(user: SafeUser, query: ClaimQuery) {
    assertStaff(user);
    return claimRepository.findMany(query);
  },

  async getAdminClaimById(user: SafeUser, claimId: string) {
    assertStaff(user);

    const claim = await claimRepository.findById(claimId);

    if (!claim) {
      throw new AppError('Claim not found', 404);
    }

    return claim;
  },

  async updateClaimStatus(user: SafeUser, claimId: string, input: UpdateClaimStatusInput) {
    assertStaff(user);

    try {
      return await claimRepository.updateStatus(claimId, input);
    } catch (error) {
      handleormError(error);
    }
  },

  async approveClaim(user: SafeUser, claimId: string, input: ApproveClaimInput) {
    assertStaff(user);

    try {
      return await claimRepository.approve(claimId, input);
    } catch (error) {
      handleormError(error);
    }
  },

  async rejectClaim(user: SafeUser, claimId: string, input: RejectClaimInput) {
    assertStaff(user);

    try {
      return await claimRepository.reject(claimId, input);
    } catch (error) {
      handleormError(error);
    }
  },
};
