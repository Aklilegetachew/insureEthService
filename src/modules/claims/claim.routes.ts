import { UserRole } from '#database';
import { Router } from 'express';

import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { claimController } from './claim.controller.js';
import {
  approveClaimSchema,
  claimIdSchema,
  createClaimSchema,
  listAdminClaimsSchema,
  rejectClaimSchema,
  updateClaimStatusSchema,
} from './claim.validation.js';

const staffRoles = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.CLAIM_OFFICER,
  UserRole.MANAGER,
  UserRole.BRANCH_MANAGER,
  UserRole.ASSESSOR,
] as const;

export const claimRouter = Router();

claimRouter.use(authenticate);
claimRouter.post(
  '/',
  authorizeRoles(UserRole.CUSTOMER),
  validate(createClaimSchema),
  claimController.createClaim,
);
claimRouter.get('/my', authorizeRoles(UserRole.CUSTOMER), claimController.listMyClaims);
claimRouter.get(
  '/:id',
  authorizeRoles(UserRole.CUSTOMER),
  validate(claimIdSchema),
  claimController.getMyClaimById,
);

export const adminClaimRouter = Router();

adminClaimRouter.use(authenticate, authorizeRoles(...staffRoles));
adminClaimRouter.get('/', validate(listAdminClaimsSchema), claimController.listAdminClaims);
adminClaimRouter.get('/:id', validate(claimIdSchema), claimController.getAdminClaimById);
adminClaimRouter.patch(
  '/:id/status',
  validate(updateClaimStatusSchema),
  claimController.updateClaimStatus,
);
adminClaimRouter.patch(
  '/:id/approve',
  validate(approveClaimSchema),
  claimController.approveClaim,
);
adminClaimRouter.patch(
  '/:id/reject',
  validate(rejectClaimSchema),
  claimController.rejectClaim,
);
