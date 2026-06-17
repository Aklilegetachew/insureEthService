import { UserRole } from '#database';
import { Router } from 'express';

import { authenticate } from '../../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../../middlewares/role.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import { staffController } from './staff.controller.js';
import {
  createStaffSchema,
  listStaffSchema,
  resetStaffPasswordSchema,
  staffIdSchema,
  updateStaffSchema,
  updateStaffStatusSchema,
} from './staff.validation.js';

export const adminStaffRouter = Router();

adminStaffRouter.use(authenticate, authorizeRoles(UserRole.SUPER_ADMIN));
adminStaffRouter.get('/', validate(listStaffSchema), staffController.listStaff);
adminStaffRouter.get('/:id', validate(staffIdSchema), staffController.getStaff);
adminStaffRouter.post('/', validate(createStaffSchema), staffController.createStaff);
adminStaffRouter.put('/:id', validate(updateStaffSchema), staffController.updateStaff);
adminStaffRouter.patch('/:id/status', validate(updateStaffStatusSchema), staffController.updateStatus);
adminStaffRouter.post('/:id/reset-password', validate(resetStaffPasswordSchema), staffController.resetPassword);

