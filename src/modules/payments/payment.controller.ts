import { ApiResponse } from '../../utils/api-response.js';
import { AppError } from '../../utils/app-error.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { paymentService } from './payment.service.js';
import type { PaymentQuery } from './payment.types.js';

const requireUser = (user: Express.Request['user']) => {
  if (!user) {
    throw new AppError('Authentication is required', 401);
  }

  return user;
};

export const paymentController = {
  createPayment: asyncHandler(async (req, res) => {
    const user = requireUser(req.user);
    const payment = await paymentService.createPayment(user, req.body);

    res.status(201).json(
      ApiResponse.success({
        message: 'Payment submitted successfully',
        data: { payment },
      }),
    );
  }),

  listMyPayments: asyncHandler(async (req, res) => {
    const user = requireUser(req.user);
    const payments = await paymentService.listMyPayments(user);

    res.status(200).json(
      ApiResponse.success({
        message: 'Payments retrieved successfully',
        data: { payments },
      }),
    );
  }),

  listAdminPayments: asyncHandler(async (req, res) => {
    const user = requireUser(req.user);
    const payments = await paymentService.listAdminPayments(user, req.query as PaymentQuery);

    res.status(200).json(
      ApiResponse.success({
        message: 'Admin payments retrieved successfully',
        data: { payments },
      }),
    );
  }),

  verifyPayment: asyncHandler(async (req, res) => {
    const user = requireUser(req.user);
    const payment = await paymentService.verifyPayment(
      user,
      req.params.id as string,
      req.body,
    );

    res.status(200).json(
      ApiResponse.success({
        message: 'Payment verified successfully',
        data: { payment },
      }),
    );
  }),

  rejectPayment: asyncHandler(async (req, res) => {
    const user = requireUser(req.user);
    const payment = await paymentService.rejectPayment(
      user,
      req.params.id as string,
      req.body,
    );

    res.status(200).json(
      ApiResponse.success({
        message: 'Payment rejected successfully',
        data: { payment },
      }),
    );
  }),
};
