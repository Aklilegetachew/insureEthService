import { Router } from 'express';

import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { accessControlController } from './access-control.controller.js';
import {
  emptyAccessControlSchema,
  updateRolePermissionsSchema,
} from './access-control.validation.js';

export const accessControlRouter = Router();

accessControlRouter.use(authenticate);
accessControlRouter.get('/roles', validate(emptyAccessControlSchema), accessControlController.listRoles);
accessControlRouter.put('/roles/:role/permissions', validate(updateRolePermissionsSchema), accessControlController.updateRolePermissions);
accessControlRouter.post('/roles/reset-defaults', validate(emptyAccessControlSchema), accessControlController.resetDefaults);
