import { UserRole } from '@prisma/client';
import { Router } from 'express';

import { authenticate } from '../../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../../middlewares/role.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import { customerController } from './customer.controller.js';
import { customerIdSchema, listCustomersSchema } from './customer.validation.js';

export const adminCustomerRouter = Router();

adminCustomerRouter.use(authenticate, authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER));
adminCustomerRouter.get('/', validate(listCustomersSchema), customerController.listCustomers);
adminCustomerRouter.get('/:id', validate(customerIdSchema), customerController.getCustomer);

