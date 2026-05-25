import type { UserRole } from '@prisma/client';

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
