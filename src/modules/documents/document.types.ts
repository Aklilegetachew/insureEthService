import type { DocumentOwnerType } from '@prisma/client';

export type CreateDocumentInput = {
  ownerType: DocumentOwnerType;
  ownerId: string;
  documentType: string;
  originalFileName: string;
  storedFileName: string;
  mimeType: string;
  size: number;
  fileUrl: string;
};

export type DocumentReviewInput = {
  reviewNote?: string;
};
