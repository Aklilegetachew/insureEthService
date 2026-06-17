import type { DocumentOwnerType } from '#database';

import { ApiResponse } from '../../utils/api-response.js';
import { AppError } from '../../utils/app-error.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { documentService } from './document.service.js';
import type { DocumentStatus } from '#database';

const requireUser = (user: Express.Request['user']) => {
  if (!user) {
    throw new AppError('Authentication is required', 401);
  }

  return user;
};

export const documentController = {
  uploadDocument: asyncHandler(async (req, res) => {
    const user = requireUser(req.user);

    if (!req.file) {
      throw new AppError('A document file is required', 400);
    }

    const document = await documentService.uploadDocument(user, {
      ...req.body,
      originalFileName: req.file.originalname,
      storedFileName: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      fileUrl: `/uploads/${req.file.filename}`,
    });

    res.status(201).json(
      ApiResponse.success({
        message: 'Document uploaded successfully',
        data: { document },
      }),
    );
  }),

  getDocumentById: asyncHandler(async (req, res) => {
    const user = requireUser(req.user);
    const document = await documentService.getDocumentById(
      user,
      req.params.id as string,
    );

    res.status(200).json(
      ApiResponse.success({
        message: 'Document retrieved successfully',
        data: { document },
      }),
    );
  }),

  listDocumentsByOwner: asyncHandler(async (req, res) => {
    const user = requireUser(req.user);
    const documents = await documentService.listDocumentsByOwner(
      user,
      req.params.ownerType as DocumentOwnerType,
      req.params.ownerId as string,
    );

    res.status(200).json(
      ApiResponse.success({
        message: 'Documents retrieved successfully',
        data: { documents },
      }),
    );
  }),

  listAdminDocuments: asyncHandler(async (req, res) => {
    const user = requireUser(req.user);
    const filters = {
      ...(typeof req.query.search === 'string' ? { search: req.query.search } : {}),
      ...(typeof req.query.status === 'string' ? { status: req.query.status as DocumentStatus } : {}),
      ...(typeof req.query.ownerType === 'string'
        ? { ownerType: req.query.ownerType as DocumentOwnerType }
        : {}),
      ...(typeof req.query.documentType === 'string'
        ? { documentType: req.query.documentType }
        : {}),
    };
    const documents = await documentService.listAdminDocuments(user, filters);

    res.status(200).json(
      ApiResponse.success({
        message: 'Admin documents retrieved successfully',
        data: { documents },
      }),
    );
  }),

  approveDocument: asyncHandler(async (req, res) => {
    const user = requireUser(req.user);
    const document = await documentService.approveDocument(
      user,
      req.params.id as string,
      req.body,
    );

    res.status(200).json(
      ApiResponse.success({
        message: 'Document approved successfully',
        data: { document },
      }),
    );
  }),

  rejectDocument: asyncHandler(async (req, res) => {
    const user = requireUser(req.user);
    const document = await documentService.rejectDocument(
      user,
      req.params.id as string,
      req.body,
    );

    res.status(200).json(
      ApiResponse.success({
        message: 'Document rejected successfully',
        data: { document },
      }),
    );
  }),
};
