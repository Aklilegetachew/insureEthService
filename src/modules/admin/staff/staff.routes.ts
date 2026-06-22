import { Router } from 'express';

import { authenticate } from '../../../middlewares/auth.middleware.js';
import { authorizePermission } from '../../../middlewares/role.middleware.js';
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

adminStaffRouter.use(authenticate);
adminStaffRouter.get('/', authorizePermission('staff.view'), validate(listStaffSchema), staffController.listStaff);
adminStaffRouter.get('/:id', authorizePermission('staff.view'), validate(staffIdSchema), staffController.getStaff);
adminStaffRouter.post('/', authorizePermission('staff.create'), validate(createStaffSchema), staffController.createStaff);
adminStaffRouter.put('/:id', authorizePermission('staff.edit'), validate(updateStaffSchema), staffController.updateStaff);
adminStaffRouter.patch('/:id/status', authorizePermission('staff.status'), validate(updateStaffStatusSchema), staffController.updateStatus);
adminStaffRouter.post('/:id/reset-password', authorizePermission('staff.reset_password'), validate(resetStaffPasswordSchema), staffController.resetPassword);

