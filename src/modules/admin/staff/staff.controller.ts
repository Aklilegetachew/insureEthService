import { ApiResponse } from '../../../utils/api-response.js';
import { AppError } from '../../../utils/app-error.js';
import { asyncHandler } from '../../../utils/async-handler.js';
import { staffService } from './staff.service.js';
import type { StaffQuery } from './staff.types.js';

const requireUser = (user: Express.Request['user']) => {
  if (!user) {
    throw new AppError('Authentication is required', 401);
  }

  return user;
};

export const staffController = {
  listStaff: asyncHandler(async (req, res) => {
    const user = requireUser(req.user);
    const staff = await staffService.listStaff(user, req.query as StaffQuery);

    res.status(200).json(
      ApiResponse.success({
        message: 'Staff retrieved successfully',
        data: { staff },
      }),
    );
  }),

  getStaff: asyncHandler(async (req, res) => {
    const user = requireUser(req.user);
    const staff = await staffService.getStaff(user, req.params.id as string);

    res.status(200).json(
      ApiResponse.success({
        message: 'Staff member retrieved successfully',
        data: { staff },
      }),
    );
  }),

  createStaff: asyncHandler(async (req, res) => {
    const user = requireUser(req.user);
    const staff = await staffService.createStaff(user, req.body);

    res.status(201).json(
      ApiResponse.success({
        message: 'Staff member created successfully',
        data: { staff },
      }),
    );
  }),

  updateStaff: asyncHandler(async (req, res) => {
    const user = requireUser(req.user);
    const staff = await staffService.updateStaff(user, req.params.id as string, req.body);

    res.status(200).json(
      ApiResponse.success({
        message: 'Staff member updated successfully',
        data: { staff },
      }),
    );
  }),

  updateStatus: asyncHandler(async (req, res) => {
    const user = requireUser(req.user);
    const staff = await staffService.updateStatus(user, req.params.id as string, req.body.status);

    res.status(200).json(
      ApiResponse.success({
        message: 'Staff status updated successfully',
        data: { staff },
      }),
    );
  }),

  resetPassword: asyncHandler(async (req, res) => {
    const user = requireUser(req.user);
    const result = await staffService.resetPassword(user, req.params.id as string, req.body.temporaryPassword);

    res.status(200).json(
      ApiResponse.success({
        message: 'Temporary password generated successfully',
        data: result,
      }),
    );
  }),
};

