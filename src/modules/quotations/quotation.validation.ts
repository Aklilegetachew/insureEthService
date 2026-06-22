import { QuotationStatus } from '#database';
import { z } from 'zod';

const optionalPositiveNumber = z.coerce.number().positive().optional();

const customerInputSchema = z
  .object({
    applicant: z.object({
      fullName: z.string().trim().min(2).max(120),
      email: z.string().trim().email().toLowerCase(),
      phone: z.string().trim().min(7).max(30),
      address: z.string().trim().min(2).max(250),
      nationalId: z.string().trim().min(2).max(80),
    }),
  })
  .catchall(z.unknown());

export const createQuotationSchema = z.object({
  body: z.object({
    productId: z.string().uuid(),
    requestedCoverageAmount: z.coerce.number().positive(),
    customerInput: customerInputSchema,
    validUntil: z.string().datetime().optional(),
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({}),
});

export const quotationIdSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({}).default({}),
});

export const listAdminQuotationsSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({}).default({}),
  query: z.object({
    status: z.nativeEnum(QuotationStatus).optional(),
    customerId: z.string().uuid().optional(),
    productId: z.string().uuid().optional(),
    search: z.string().trim().min(1).optional(),
  }),
});

export const quotationDecisionSchema = z.object({
  body: z.object({
    adminNote: z.string().trim().max(2000).optional(),
    finalPremium: optionalPositiveNumber,
    appointmentAt: z.string().datetime().optional(),
    appointmentLocation: z.string().trim().min(2).max(250).optional(),
    appointmentNote: z.string().trim().max(1000).optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({}).default({}),
});
