import { DocumentOwnerType, Orm, UserRole, type DocumentStatus } from '#database';

import { orm } from '../../config/orm.js';
import { AppError } from '../../utils/app-error.js';
import type { SafeUser } from '../auth/auth.types.js';
import { documentRepository } from './document.repository.js';
import type { CreateDocumentInput, DocumentReviewInput } from './document.types.js';

const isStaff = (user: SafeUser) => user.role !== UserRole.CUSTOMER;

const handleormError = (error: unknown): never => {
  if (error instanceof Orm.KnownRequestError) {
    if (error.code === 'P2025') {
      throw new AppError('Document not found', 404);
    }
  }

  throw error;
};

const getOwnerCustomerId = async (ownerType: DocumentOwnerType, ownerId: string) => {
  if (ownerType === DocumentOwnerType.CUSTOMER) {
    const owner = await documentRepository.findCustomerOwner(ownerId);
    return owner?.userId ?? null;
  }

  if (ownerType === DocumentOwnerType.QUOTATION) {
    const owner = await documentRepository.findQuotationOwner(ownerId);
    return owner?.customerId ?? null;
  }

  if (ownerType === DocumentOwnerType.POLICY) {
    const owner = await documentRepository.findPolicyOwner(ownerId);
    return owner?.customerId ?? null;
  }

  if (ownerType === DocumentOwnerType.CLAIM) {
    const owner = await documentRepository.findClaimOwner(ownerId);
    return owner?.customerId ?? null;
  }

  const owner = await documentRepository.findPaymentOwner(ownerId);
  return owner?.customerId ?? null;
};

const assertCanAccessOwner = async (
  user: SafeUser,
  ownerType: DocumentOwnerType,
  ownerId: string,
) => {
  if (isStaff(user)) return;

  const ownerCustomerId = await getOwnerCustomerId(ownerType, ownerId);

  if (!ownerCustomerId) {
    throw new AppError('Document owner resource not found', 404);
  }

  if (ownerCustomerId !== user.id) {
    throw new AppError('You do not have permission to access this document owner', 403);
  }
};

const resolveOwnerLabel = async (document: Awaited<ReturnType<typeof documentRepository.findById>>) => {
  if (!document) return null;

  switch (document.ownerType) {
    case DocumentOwnerType.CUSTOMER: {
      const owner = await documentRepository.findCustomerOwner(document.ownerId);
      if (!owner) return null;

      const customer = await orm.user.findUnique({
        where: { id: owner.userId },
        select: { fullName: true, email: true },
      });
      return customer?.fullName ?? customer?.email ?? owner.userId;
    }
    case DocumentOwnerType.QUOTATION: {
      const quotation = await orm.quotation.findUnique({
        where: { id: document.ownerId },
        select: {
          quotationNumber: true,
          customer: {
            select: { fullName: true },
          },
        },
      });
      return quotation?.quotationNumber ?? quotation?.customer.fullName ?? document.ownerId;
    }
    case DocumentOwnerType.POLICY: {
      const policy = await orm.policy.findUnique({
        where: { id: document.ownerId },
        select: {
          policyNumber: true,
          customer: {
            select: { fullName: true },
          },
        },
      });
      return policy?.policyNumber ?? policy?.customer.fullName ?? document.ownerId;
    }
    case DocumentOwnerType.CLAIM: {
      const claim = await orm.claim.findUnique({
        where: { id: document.ownerId },
        select: {
          claimNumber: true,
          customer: {
            select: { fullName: true },
          },
        },
      });
      return claim?.claimNumber ?? claim?.customer.fullName ?? document.ownerId;
    }
    case DocumentOwnerType.PAYMENT: {
      const payment = await orm.payment.findUnique({
        where: { id: document.ownerId },
        select: {
          paymentReference: true,
          customer: {
            select: { fullName: true },
          },
        },
      });
      return payment?.paymentReference ?? payment?.customer.fullName ?? document.ownerId;
    }
    default:
      return document.ownerId;
  }
};

export const documentService = {
  async uploadDocument(user: SafeUser, input: CreateDocumentInput) {
    await assertCanAccessOwner(user, input.ownerType, input.ownerId);

    try {
      return await documentRepository.create(user.id, input);
    } catch (error) {
      handleormError(error);
    }
  },

  async getDocumentById(user: SafeUser, documentId: string) {
    const document = await documentRepository.findById(documentId);

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    await assertCanAccessOwner(user, document.ownerType, document.ownerId);
    return document;
  },

  async listDocumentsByOwner(
    user: SafeUser,
    ownerType: DocumentOwnerType,
    ownerId: string,
  ) {
    await assertCanAccessOwner(user, ownerType, ownerId);
    return documentRepository.findByOwner(ownerType, ownerId);
  },

  async approveDocument(user: SafeUser, documentId: string, input: DocumentReviewInput) {
    if (!isStaff(user)) {
      throw new AppError('You do not have permission to access this resource', 403);
    }

    try {
      return await documentRepository.approve(documentId, input);
    } catch (error) {
      handleormError(error);
    }
  },

  async rejectDocument(user: SafeUser, documentId: string, input: DocumentReviewInput) {
    if (!isStaff(user)) {
      throw new AppError('You do not have permission to access this resource', 403);
    }

    try {
      return await documentRepository.reject(documentId, input);
    } catch (error) {
      handleormError(error);
    }
  },

  async listAdminDocuments(user: SafeUser, filters: {
    search?: string;
    status?: DocumentStatus;
    ownerType?: DocumentOwnerType;
    documentType?: string;
  }) {
    if (!isStaff(user)) {
      throw new AppError('You do not have permission to access this resource', 403);
    }

    const documents = await documentRepository.findAdminMany(filters);
    const ownerLabels = await Promise.all(documents.map((document) => resolveOwnerLabel(document)));

    return documents.map((document, index) => ({
      ...document,
      ownerLabel: ownerLabels[index] ?? null,
    }));
  },
};
