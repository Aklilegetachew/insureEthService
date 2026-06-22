import { UserRole } from '#database';
import { Router } from 'express';

import { authenticate } from '../../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../../middlewares/role.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import { reportsController } from './reports.controller.js';
import { reportQuerySchema } from './reports.validation.js';

export const adminReportsRouter = Router();

adminReportsRouter.use(authenticate, authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.BRANCH_MANAGER));
adminReportsRouter.get('/summary', validate(reportQuerySchema), reportsController.summary);
adminReportsRouter.get('/policies', validate(reportQuerySchema), reportsController.policies);
adminReportsRouter.get('/claims', validate(reportQuerySchema), reportsController.claims);
adminReportsRouter.get('/payments', validate(reportQuerySchema), reportsController.payments);

