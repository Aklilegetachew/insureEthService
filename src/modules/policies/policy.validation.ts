import { PolicyStatus } from '#database';
import { z } from 'zod';

const policyDataSchema = z.record(z.string(), z.unknown()).optional();

export const policyIdSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({}).default({}),
});

export const quotationIdParamSchema = z.object({
  body: z.object({
    startDate: z.string().datetime().optional(),
    policyData: policyDataSchema,
  }),
  params: z.object({
    quotationId: z.string().uuid(),
  }),
  query: z.object({}).default({}),
});

export const listAdminPoliciesSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({}).default({}),
  query: z.object({
    status: z.nativeEnum(PolicyStatus).optional(),
    customerId: z.string().uuid().optional(),
    productId: z.string().uuid().optional(),
    search: z.string().trim().min(1).optional(),
  }),
});

export const updatePolicyStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(PolicyStatus),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({}).default({}),
});
