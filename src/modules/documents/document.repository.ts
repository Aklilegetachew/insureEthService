import { DocumentOwnerType, DocumentStatus } from '@prisma/client';

import { prisma } from '../../config/prisma.js';
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
    return prisma.document.findMany({
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
    return prisma.document.create({
      data: {
        ...input,
        uploadedByUserId,
        status: DocumentStatus.PENDING_REVIEW,
      },
      include: documentInclude,
    });
  },

  findById(id: string) {
    return prisma.document.findUnique({
      where: { id },
      include: documentInclude,
    });
  },

  findByOwner(ownerType: DocumentOwnerType, ownerId: string) {
    return prisma.document.findMany({
      where: { ownerType, ownerId },
      include: documentInclude,
      orderBy: { createdAt: 'desc' },
    });
  },

  approve(id: string, input: DocumentReviewInput) {
    return prisma.document.update({
      where: { id },
      data: {
        status: DocumentStatus.APPROVED,
        ...(input.reviewNote !== undefined ? { reviewNote: input.reviewNote } : {}),
      },
      include: documentInclude,
    });
  },

  reject(id: string, input: DocumentReviewInput) {
    return prisma.document.update({
      where: { id },
      data: {
        status: DocumentStatus.REJECTED,
        ...(input.reviewNote !== undefined ? { reviewNote: input.reviewNote } : {}),
      },
      include: documentInclude,
    });
  },

  findCustomerOwner(ownerId: string) {
    return prisma.customerProfile.findFirst({
      where: { OR: [{ id: ownerId }, { userId: ownerId }] },
      select: { id: true, userId: true },
    });
  },

  findQuotationOwner(ownerId: string) {
    return prisma.quotation.findUnique({
      where: { id: ownerId },
      select: { id: true, customerId: true },
    });
  },

  findPolicyOwner(ownerId: string) {
    return prisma.policy.findUnique({
      where: { id: ownerId },
      select: { id: true, customerId: true },
    });
  },

  findClaimOwner(ownerId: string) {
    return prisma.claim.findUnique({
      where: { id: ownerId },
      select: { id: true, customerId: true },
    });
  },

  findPaymentOwner(ownerId: string) {
    return prisma.payment.findUnique({
      where: { id: ownerId },
      select: { id: true, customerId: true },
    });
  },
};
