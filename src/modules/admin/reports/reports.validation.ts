import { z } from 'zod';

export const reportQuerySchema = z.object({
  body: z.object({}).default({}),
  params: z.object({}).default({}),
  query: z.object({
    dateRange: z.string().trim().min(1).optional(),
    productId: z.string().uuid().optional(),
    branchId: z.string().trim().min(1).optional(),
  }),
});

