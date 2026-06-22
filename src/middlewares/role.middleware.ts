import type { UserRole } from '#database';

import { accessControlService } from '../modules/access-control/access-control.service.js';
import type { PermissionKey } from '../modules/access-control/access-control.types.js';
import { AppError } from '../utils/app-error.js';
import { asyncHandler } from '../utils/async-handler.js';

export const authorizeRoles = (...roles: UserRole[]) =>
  asyncHandler(async (req, _res, next) => {
    if (!req.user) {
      throw new AppError('Authentication is required', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError('You do not have permission to access this resource', 403);
    }

    next();
  });

export const authorizePermission = (permission: PermissionKey) =>
  asyncHandler(async (req, _res, next) => {
    if (!req.user) {
      throw new AppError('Authentication is required', 401);
    }

    const allowed = await accessControlService.roleHasPermission(req.user.role, permission);

    if (!allowed) {
      throw new AppError('You do not have permission to perform this action', 403);
    }

    next();
  });
