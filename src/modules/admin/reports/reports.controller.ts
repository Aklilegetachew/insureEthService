import { ApiResponse } from '../../../utils/api-response.js';
import { AppError } from '../../../utils/app-error.js';
import { asyncHandler } from '../../../utils/async-handler.js';
import { reportsService } from './reports.service.js';
import type { ReportFilters } from './reports.types.js';

const requireUser = (user: Express.Request['user']) => {
  if (!user) {
    throw new AppError('Authentication is required', 401);
  }

  return user;
};

export const reportsController = {
  summary: asyncHandler(async (req, res) => {
    requireUser(req.user);
    const summary = await reportsService.getSummary(req.query as ReportFilters);

    res.status(200).json(
      ApiResponse.success({
        message: 'Report summary retrieved successfully',
        data: { summary },
      }),
    );
  }),

  policies: asyncHandler(async (req, res) => {
    requireUser(req.user);
    const policies = await reportsService.listPolicies(req.query as ReportFilters);

    res.status(200).json(
      ApiResponse.success({
        message: 'Policy report retrieved successfully',
        data: { policies },
      }),
    );
  }),

  claims: asyncHandler(async (req, res) => {
    requireUser(req.user);
    const claims = await reportsService.listClaims(req.query as ReportFilters);

    res.status(200).json(
      ApiResponse.success({
        message: 'Claim report retrieved successfully',
        data: { claims },
      }),
    );
  }),

  payments: asyncHandler(async (req, res) => {
    requireUser(req.user);
    const payments = await reportsService.listPayments(req.query as ReportFilters);

    res.status(200).json(
      ApiResponse.success({
        message: 'Payment report retrieved successfully',
        data: { payments },
      }),
    );
  }),
};

