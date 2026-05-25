import { ApiResponse } from '../../utils/api-response.js';
import { AppError } from '../../utils/app-error.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { authService } from './auth.service.js';

export const authController = {
  registerCustomer: asyncHandler(async (req, res) => {
    const result = await authService.registerCustomer(req.body);

    res.status(201).json(
      ApiResponse.success({
        message: 'Customer registered successfully',
        data: result,
      }),
    );
  }),

  login: asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);

    res.status(200).json(
      ApiResponse.success({
        message: 'Login successful',
        data: result,
      }),
    );
  }),

  me: asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new AppError('Authentication is required', 401);
    }

    const user = await authService.getCurrentUser(req.user.id);

    res.status(200).json(
      ApiResponse.success({
        message: 'Authenticated user retrieved successfully',
        data: { user },
      }),
    );
  }),

  logout: asyncHandler(async (_req, res) => {
    res.status(200).json(
      ApiResponse.success({
        message: 'Logout successful',
        data: {
          note: 'Client should discard the access token',
        },
      }),
    );
  }),
};
