import { UserRole } from '#database';
import { Router } from 'express';

import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { paymentController } from './payment.controller.js';
import {
  createPaymentSchema,
  listAdminPaymentsSchema,
  paymentDecisionSchema,
} from './payment.validation.js';

const staffRoles = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.FINANCE_OFFICER,
  UserRole.MANAGER,
] as const;

export const paymentRouter = Router();

paymentRouter.use(authenticate);
paymentRouter.post(
  '/',
  authorizeRoles(UserRole.CUSTOMER),
  validate(createPaymentSchema),
  paymentController.createPayment,
);
paymentRouter.get('/my', authorizeRoles(UserRole.CUSTOMER), paymentController.listMyPayments);

export const adminPaymentRouter = Router();

adminPaymentRouter.use(authenticate, authorizeRoles(...staffRoles));
adminPaymentRouter.get(
  '/',
  validate(listAdminPaymentsSchema),
  paymentController.listAdminPayments,
);
adminPaymentRouter.patch(
  '/:id/verify',
  validate(paymentDecisionSchema),
  paymentController.verifyPayment,
);
adminPaymentRouter.patch(
  '/:id/reject',
  validate(paymentDecisionSchema),
  paymentController.rejectPayment,
);
