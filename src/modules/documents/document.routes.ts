import { UserRole } from '#database';
import { Router } from 'express';

import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { documentController } from './document.controller.js';
import { documentUpload } from './document.upload.js';
import {
  documentIdSchema,
  documentReviewSchema,
  listAdminDocumentsSchema,
  ownerDocumentsSchema,
  uploadDocumentBodySchema,
} from './document.validation.js';

const staffRoles = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.AGENT,
  UserRole.CLAIM_OFFICER,
  UserRole.ASSESSOR,
  UserRole.FINANCE_OFFICER,
] as const;

export const documentRouter = Router();

documentRouter.use(authenticate);
documentRouter.post(
  '/upload',
  documentUpload.single('file'),
  validate(uploadDocumentBodySchema),
  documentController.uploadDocument,
);
documentRouter.get(
  '/by-owner/:ownerType/:ownerId',
  validate(ownerDocumentsSchema),
  documentController.listDocumentsByOwner,
);
documentRouter.get('/:id', validate(documentIdSchema), documentController.getDocumentById);

export const adminDocumentRouter = Router();

adminDocumentRouter.use(authenticate, authorizeRoles(...staffRoles));
adminDocumentRouter.get('/', validate(listAdminDocumentsSchema), documentController.listAdminDocuments);
adminDocumentRouter.patch(
  '/:id/approve',
  validate(documentReviewSchema),
  documentController.approveDocument,
);
adminDocumentRouter.patch(
  '/:id/reject',
  validate(documentReviewSchema),
  documentController.rejectDocument,
);
