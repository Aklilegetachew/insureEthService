import { ClaimStatus } from '@prisma/client';
import { z } from 'zod';

export const createClaimSchema = z.object({
  body: z.object({
    policyId: z.string().uuid(),
    claimType: z.string().trim().min(1).max(100),
    incidentDate: z.string().datetime(),
    incidentLocation: z.string().trim().min(1).max(250),
    description: z.string().trim().min(10).max(3000),
    estimatedAmount: z.coerce.number().positive(),
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({}),
});

export const claimIdSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({}).default({}),
});

export const listAdminClaimsSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({}).default({}),
  query: z.object({
    status: z.nativeEnum(ClaimStatus).optional(),
    customerId: z.string().uuid().optional(),
    policyId: z.string().uuid().optional(),
    search: z.string().trim().min(1).optional(),
  }),
});

export const updateClaimStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(ClaimStatus),
    adminNote: z.string().trim().max(2000).optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({}).default({}),
});

export const approveClaimSchema = z.object({
  body: z.object({
    approvedAmount: z.coerce.number().positive(),
    adminNote: z.string().trim().max(2000).optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({}).default({}),
});

export const rejectClaimSchema = z.object({
  body: z.object({
    rejectionReason: z.string().trim().min(1).max(2000),
    adminNote: z.string().trim().max(2000).optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({}).default({}),
});
