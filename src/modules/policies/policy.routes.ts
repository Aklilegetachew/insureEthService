import { UserRole } from '@prisma/client';
import { Router } from 'express';

import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { policyController } from './policy.controller.js';
import {
  listAdminPoliciesSchema,
  policyIdSchema,
  quotationIdParamSchema,
  updatePolicyStatusSchema,
} from './policy.validation.js';

const staffRoles = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.CLAIM_OFFICER,
  UserRole.FINANCE_OFFICER,
  UserRole.MANAGER,
  UserRole.AGENT,
  UserRole.ASSESSOR,
] as const;

export const policyRouter = Router();

policyRouter.use(authenticate);
policyRouter.get('/my', authorizeRoles(UserRole.CUSTOMER), policyController.listMyPolicies);
policyRouter.get(
  '/:id',
  authorizeRoles(UserRole.CUSTOMER),
  validate(policyIdSchema),
  policyController.getMyPolicyById,
);

export const adminPolicyRouter = Router();

adminPolicyRouter.use(authenticate, authorizeRoles(...staffRoles));
adminPolicyRouter.get(
  '/',
  validate(listAdminPoliciesSchema),
  policyController.listAdminPolicies,
);
adminPolicyRouter.post(
  '/from-quotation/:quotationId',
  validate(quotationIdParamSchema),
  policyController.createPolicyFromQuotation,
);
adminPolicyRouter.patch(
  '/:id/status',
  validate(updatePolicyStatusSchema),
  policyController.updatePolicyStatus,
);
