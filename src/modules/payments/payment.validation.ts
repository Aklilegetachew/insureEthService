import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { z } from 'zod';

export const createPaymentSchema = z.object({
  body: z.object({
    policyId: z.string().uuid(),
    amount: z.coerce.number().positive(),
    method: z.nativeEnum(PaymentMethod),
    proofUrl: z.string().trim().url().max(1000).optional(),
    transactionReference: z.string().trim().min(1).max(150).optional(),
    paidAt: z.string().datetime().optional(),
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({}),
});

export const listAdminPaymentsSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({}).default({}),
  query: z.object({
    status: z.nativeEnum(PaymentStatus).optional(),
    method: z.nativeEnum(PaymentMethod).optional(),
    customerId: z.string().uuid().optional(),
    policyId: z.string().uuid().optional(),
    search: z.string().trim().min(1).optional(),
  }),
});

export const paymentDecisionSchema = z.object({
  body: z.object({
    financeNote: z.string().trim().max(2000).optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({}).default({}),
});
