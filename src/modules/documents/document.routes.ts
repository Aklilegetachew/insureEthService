import { Router } from 'express';

import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizePermission } from '../../middlewares/role.middleware.js';
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

adminDocumentRouter.use(authenticate);
adminDocumentRouter.get('/', authorizePermission('documents.view'), validate(listAdminDocumentsSchema), documentController.listAdminDocuments);
adminDocumentRouter.patch(
  '/:id/approve',
  authorizePermission('documents.review'),
  validate(documentReviewSchema),
  documentController.approveDocument,
);
adminDocumentRouter.patch(
  '/:id/reject',
  authorizePermission('documents.review'),
  validate(documentReviewSchema),
  documentController.rejectDocument,
);
