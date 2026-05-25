import { UserRole } from '@prisma/client';
import { Router } from 'express';

import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { quotationController } from './quotation.controller.js';
import {
  createQuotationSchema,
  listAdminQuotationsSchema,
  quotationDecisionSchema,
  quotationIdSchema,
} from './quotation.validation.js';

const staffRoles = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.CLAIM_OFFICER,
  UserRole.FINANCE_OFFICER,
  UserRole.MANAGER,
  UserRole.AGENT,
  UserRole.ASSESSOR,
] as const;

export const quotationRouter = Router();

quotationRouter.use(authenticate);

quotationRouter.post(
  '/',
  authorizeRoles(UserRole.CUSTOMER),
  validate(createQuotationSchema),
  quotationController.createQuotation,
);
quotationRouter.get(
  '/my',
  authorizeRoles(UserRole.CUSTOMER),
  quotationController.listMyQuotations,
);
quotationRouter.get(
  '/:id',
  authorizeRoles(UserRole.CUSTOMER),
  validate(quotationIdSchema),
  quotationController.getMyQuotationById,
);

export const adminQuotationRouter = Router();

adminQuotationRouter.use(authenticate, authorizeRoles(...staffRoles));

adminQuotationRouter.get(
  '/',
  validate(listAdminQuotationsSchema),
  quotationController.listAdminQuotations,
);
adminQuotationRouter.patch(
  '/:id/approve',
  validate(quotationDecisionSchema),
  quotationController.approveQuotation,
);
adminQuotationRouter.patch(
  '/:id/reject',
  validate(quotationDecisionSchema),
  quotationController.rejectQuotation,
);
