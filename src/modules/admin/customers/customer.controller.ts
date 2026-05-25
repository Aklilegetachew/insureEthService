import { ApiResponse } from '../../../utils/api-response.js';
import { AppError } from '../../../utils/app-error.js';
import { asyncHandler } from '../../../utils/async-handler.js';
import { customerService } from './customer.service.js';
import type { CustomerQuery } from './customer.types.js';

const requireUser = (user: Express.Request['user']) => {
  if (!user) {
    throw new AppError('Authentication is required', 401);
  }

  return user;
};

export const customerController = {
  listCustomers: asyncHandler(async (req, res) => {
    requireUser(req.user);
    const customers = await customerService.listCustomers(req.query as CustomerQuery);

    res.status(200).json(
      ApiResponse.success({
        message: 'Customers retrieved successfully',
        data: { customers },
      }),
    );
  }),

  getCustomer: asyncHandler(async (req, res) => {
    requireUser(req.user);
    const customer = await customerService.getCustomer(req.params.id as string);

    res.status(200).json(
      ApiResponse.success({
        message: 'Customer retrieved successfully',
        data: { customer },
      }),
    );
  }),
};

