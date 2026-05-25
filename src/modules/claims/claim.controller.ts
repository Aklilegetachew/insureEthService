import { ApiResponse } from '../../utils/api-response.js';
import { AppError } from '../../utils/app-error.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { claimService } from './claim.service.js';
import type { ClaimQuery } from './claim.types.js';

const requireUser = (user: Express.Request['user']) => {
  if (!user) {
    throw new AppError('Authentication is required', 401);
  }

  return user;
};

export const claimController = {
  createClaim: asyncHandler(async (req, res) => {
    const user = requireUser(req.user);
    const claim = await claimService.createClaim(user, req.body);

    res.status(201).json(
      ApiResponse.success({
        message: 'Claim submitted successfully',
        data: { claim },
      }),
    );
  }),

  listMyClaims: asyncHandler(async (req, res) => {
    const user = requireUser(req.user);
    const claims = await claimService.listMyClaims(user);

    res.status(200).json(
      ApiResponse.success({
        message: 'Claims retrieved successfully',
        data: { claims },
      }),
    );
  }),

  getMyClaimById: asyncHandler(async (req, res) => {
    const user = requireUser(req.user);
    const claim = await claimService.getMyClaimById(user, req.params.id as string);

    res.status(200).json(
      ApiResponse.success({
        message: 'Claim retrieved successfully',
        data: { claim },
      }),
    );
  }),

  listAdminClaims: asyncHandler(async (req, res) => {
    const user = requireUser(req.user);
    const claims = await claimService.listAdminClaims(user, req.query as ClaimQuery);

    res.status(200).json(
      ApiResponse.success({
        message: 'Admin claims retrieved successfully',
        data: { claims },
      }),
    );
  }),

  getAdminClaimById: asyncHandler(async (req, res) => {
    const user = requireUser(req.user);
    const claim = await claimService.getAdminClaimById(user, req.params.id as string);

    res.status(200).json(
      ApiResponse.success({
        message: 'Admin claim retrieved successfully',
        data: { claim },
      }),
    );
  }),

  updateClaimStatus: asyncHandler(async (req, res) => {
    const user = requireUser(req.user);
    const claim = await claimService.updateClaimStatus(
      user,
      req.params.id as string,
      req.body,
    );

    res.status(200).json(
      ApiResponse.success({
        message: 'Claim status updated successfully',
        data: { claim },
      }),
    );
  }),

  approveClaim: asyncHandler(async (req, res) => {
    const user = requireUser(req.user);
    const claim = await claimService.approveClaim(user, req.params.id as string, req.body);

    res.status(200).json(
      ApiResponse.success({
        message: 'Claim approved successfully',
        data: { claim },
      }),
    );
  }),

  rejectClaim: asyncHandler(async (req, res) => {
    const user = requireUser(req.user);
    const claim = await claimService.rejectClaim(user, req.params.id as string, req.body);

    res.status(200).json(
      ApiResponse.success({
        message: 'Claim rejected successfully',
        data: { claim },
      }),
    );
  }),
};
