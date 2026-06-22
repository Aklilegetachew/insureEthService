import { ApiResponse } from '../../utils/api-response.js';
import { AppError } from '../../utils/app-error.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { accessControlService } from './access-control.service.js';
import type { StaffRole } from './access-control.types.js';

const requireUser = (user: Express.Request['user']) => {
  if (!user) {
    throw new AppError('Authentication is required', 401);
  }

  return user;
};

export const accessControlController = {
  listRoles: asyncHandler(async (_req, res) => {
    const data = await accessControlService.getAccessControl();

    res.status(200).json(
      ApiResponse.success({
        message: 'Roles retrieved successfully',
        data,
      }),
    );
  }),

  updateRolePermissions: asyncHandler(async (req, res) => {
    const user = requireUser(req.user);
    const data = await accessControlService.updateRolePermissions(
      user,
      req.params.role as StaffRole,
      req.body.permissions,
    );

    res.status(200).json(
      ApiResponse.success({
        message: 'Role permissions updated successfully',
        data,
      }),
    );
  }),

  resetDefaults: asyncHandler(async (req, res) => {
    const user = requireUser(req.user);
    const data = await accessControlService.resetDefaults(user);

    res.status(200).json(
      ApiResponse.success({
        message: 'Role permissions reset successfully',
        data,
      }),
    );
  }),
};
