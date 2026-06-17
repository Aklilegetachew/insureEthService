import { UserStatus } from '#database';
import { z } from 'zod';

export const listCustomersSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({}).default({}),
  query: z.object({
    search: z.string().trim().min(1).optional(),
    status: z.nativeEnum(UserStatus).optional(),
  }),
});

export const customerIdSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({}).default({}),
});

