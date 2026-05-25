import { ApiResponse } from '../../utils/api-response.js';
import { AppError } from '../../utils/app-error.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { policyService } from './policy.service.js';
import type { PolicyQuery } from './policy.types.js';

const requireUser = (user: Express.Request['user']) => {
  if (!user) {
    throw new AppError('Authentication is required', 401);
  }

  return user;
};

export const policyController = {
  listMyPolicies: asyncHandler(async (req, res) => {
    const user = requireUser(req.user);
    const policies = await policyService.listMyPolicies(user);

    res.status(200).json(
      ApiResponse.success({
        message: 'Policies retrieved successfully',
        data: { policies },
      }),
    );
  }),

  getMyPolicyById: asyncHandler(async (req, res) => {
    const user = requireUser(req.user);
    const policy = await policyService.getMyPolicyById(user, req.params.id as string);

    res.status(200).json(
      ApiResponse.success({
        message: 'Policy retrieved successfully',
        data: { policy },
      }),
    );
  }),

  listAdminPolicies: asyncHandler(async (req, res) => {
    const user = requireUser(req.user);
    const policies = await policyService.listAdminPolicies(user, req.query as PolicyQuery);

    res.status(200).json(
      ApiResponse.success({
        message: 'Admin policies retrieved successfully',
        data: { policies },
      }),
    );
  }),

  createPolicyFromQuotation: asyncHandler(async (req, res) => {
    const user = requireUser(req.user);
    const policy = await policyService.createPolicyFromQuotation(
      user,
      req.params.quotationId as string,
      req.body,
    );

    res.status(201).json(
      ApiResponse.success({
        message: 'Policy created from quotation successfully',
        data: { policy },
      }),
    );
  }),

  updatePolicyStatus: asyncHandler(async (req, res) => {
    const user = requireUser(req.user);
    const policy = await policyService.updatePolicyStatus(
      user,
      req.params.id as string,
      req.body,
    );

    res.status(200).json(
      ApiResponse.success({
        message: 'Policy status updated successfully',
        data: { policy },
      }),
    );
  }),
};
