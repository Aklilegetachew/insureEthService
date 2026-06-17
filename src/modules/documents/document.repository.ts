import { DocumentOwnerType, DocumentStatus } from '#database';

import { orm } from '../../config/orm.js';
import type { CreateDocumentInput, DocumentReviewInput } from './document.types.js';

const documentInclude = {
  uploadedBy: {
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      status: true,
    },
  },
} as const;

export const documentRepository = {
  findAdminMany(filters: {
    search?: string;
    status?: DocumentStatus;
    ownerType?: DocumentOwnerType;
    documentType?: string;
  }) {
    return orm.document.findMany({
      where: {
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.ownerType ? { ownerType: filters.ownerType } : {}),
        ...(filters.documentType
          ? { documentType: { contains: filters.documentType, mode: 'insensitive' } }
          : {}),
        ...(filters.search
          ? {
              OR: [
                {
                  originalFileName: {
                    contains: filters.search,
                    mode: 'insensitive',
                  },
                },
                {
                  ownerId: {
                    contains: filters.search,
                    mode: 'insensitive',
                  },
                },
                {
                  documentType: {
                    contains: filters.search,
                    mode: 'insensitive',
                  },
                },
                {
                  uploadedBy: {
                    is: {
                      fullName: {
                        contains: filters.search,
                        mode: 'insensitive',
                      },
                    },
                  },
                },
                {
                  uploadedBy: {
                    is: {
                      email: {
                        contains: filters.search,
                        mode: 'insensitive',
                      },
                    },
                  },
                },
              ],
            }
          : {}),
      },
      include: documentInclude,
      orderBy: { createdAt: 'desc' },
    });
  },

  create(uploadedByUserId: string, input: CreateDocumentInput) {
    return orm.document.create({
      data: {
        ...input,
        uploadedByUserId,
        status: DocumentStatus.PENDING_REVIEW,
      },
      include: documentInclude,
    });
  },

  findById(id: string) {
    return orm.document.findUnique({
      where: { id },
      include: documentInclude,
    });
  },

  findByOwner(ownerType: DocumentOwnerType, ownerId: string) {
    return orm.document.findMany({
      where: { ownerType, ownerId },
      include: documentInclude,
      orderBy: { createdAt: 'desc' },
    });
  },

  approve(id: string, input: DocumentReviewInput) {
    return orm.document.update({
      where: { id },
      data: {
        status: DocumentStatus.APPROVED,
        ...(input.reviewNote !== undefined ? { reviewNote: input.reviewNote } : {}),
      },
      include: documentInclude,
    });
  },

  reject(id: string, input: DocumentReviewInput) {
    return orm.document.update({
      where: { id },
      data: {
        status: DocumentStatus.REJECTED,
        ...(input.reviewNote !== undefined ? { reviewNote: input.reviewNote } : {}),
      },
      include: documentInclude,
    });
  },

  findCustomerOwner(ownerId: string) {
    return orm.customerProfile.findFirst({
      where: { OR: [{ id: ownerId }, { userId: ownerId }] },
      select: { id: true, userId: true },
    });
  },

  findQuotationOwner(ownerId: string) {
    return orm.quotation.findUnique({
      where: { id: ownerId },
      select: { id: true, customerId: true },
    });
  },

  findPolicyOwner(ownerId: string) {
    return orm.policy.findUnique({
      where: { id: ownerId },
      select: { id: true, customerId: true },
    });
  },

  findClaimOwner(ownerId: string) {
    return orm.claim.findUnique({
      where: { id: ownerId },
      select: { id: true, customerId: true },
    });
  },

  findPaymentOwner(ownerId: string) {
    return orm.payment.findUnique({
      where: { id: ownerId },
      select: { id: true, customerId: true },
    });
  },
};
