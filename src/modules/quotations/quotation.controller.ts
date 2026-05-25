import { ApiResponse } from '../../utils/api-response.js';
import { AppError } from '../../utils/app-error.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { quotationService } from './quotation.service.js';
import type { QuotationQuery } from './quotation.types.js';

const requireUser = (user: Express.Request['user']) => {
  if (!user) {
    throw new AppError('Authentication is required', 401);
  }

  return user;
};

export const quotationController = {
  createQuotation: asyncHandler(async (req, res) => {
    const user = requireUser(req.user);
    const quotation = await quotationService.createQuotation(user, req.body);

    res.status(201).json(
      ApiResponse.success({
        message: 'Quotation requested successfully',
        data: { quotation },
      }),
    );
  }),

  listMyQuotations: asyncHandler(async (req, res) => {
    const user = requireUser(req.user);
    const quotations = await quotationService.listMyQuotations(user);

    res.status(200).json(
      ApiResponse.success({
        message: 'Quotations retrieved successfully',
        data: { quotations },
      }),
    );
  }),

  getMyQuotationById: asyncHandler(async (req, res) => {
    const user = requireUser(req.user);
    const quotation = await quotationService.getMyQuotationById(user, req.params.id as string);

    res.status(200).json(
      ApiResponse.success({
        message: 'Quotation retrieved successfully',
        data: { quotation },
      }),
    );
  }),

  listAdminQuotations: asyncHandler(async (req, res) => {
    const user = requireUser(req.user);
    const quotations = await quotationService.listAdminQuotations(
      user,
      req.query as QuotationQuery,
    );

    res.status(200).json(
      ApiResponse.success({
        message: 'Admin quotations retrieved successfully',
        data: { quotations },
      }),
    );
  }),

  approveQuotation: asyncHandler(async (req, res) => {
    const user = requireUser(req.user);
    const quotation = await quotationService.approveQuotation(
      user,
      req.params.id as string,
      req.body,
    );

    res.status(200).json(
      ApiResponse.success({
        message: 'Quotation approved successfully',
        data: { quotation },
      }),
    );
  }),

  rejectQuotation: asyncHandler(async (req, res) => {
    const user = requireUser(req.user);
    const quotation = await quotationService.rejectQuotation(
      user,
      req.params.id as string,
      req.body,
    );

    res.status(200).json(
      ApiResponse.success({
        message: 'Quotation rejected successfully',
        data: { quotation },
      }),
    );
  }),
};
