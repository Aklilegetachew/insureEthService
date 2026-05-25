import { DocumentOwnerType } from '@prisma/client';
import { z } from 'zod';

const documentStatusSchema = z.enum(['PENDING_REVIEW', 'APPROVED', 'REJECTED']);

export const uploadDocumentBodySchema = z.object({
  body: z.object({
    ownerType: z.nativeEnum(DocumentOwnerType),
    ownerId: z.string().uuid(),
    documentType: z.string().trim().min(1).max(100),
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({}),
});

export const documentIdSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({}).default({}),
});

export const ownerDocumentsSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    ownerType: z.nativeEnum(DocumentOwnerType),
    ownerId: z.string().uuid(),
  }),
  query: z.object({}).default({}),
});

export const documentReviewSchema = z.object({
  body: z.object({
    reviewNote: z.string().trim().max(2000).optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({}).default({}),
});

export const listAdminDocumentsSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({}).default({}),
  query: z.object({
    search: z.string().trim().min(1).optional(),
    status: documentStatusSchema.optional(),
    ownerType: z.nativeEnum(DocumentOwnerType).optional(),
    documentType: z.string().trim().min(1).optional(),
  }),
});
