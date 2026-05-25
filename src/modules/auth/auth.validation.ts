import { z } from 'zod';

export const registerCustomerSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(2).max(120),
    email: z.string().trim().email().toLowerCase(),
    phone: z.string().trim().min(7).max(30),
    password: z.string().min(8).max(128),
    nationalId: z.string().trim().min(3).max(80).optional(),
    address: z.string().trim().min(2).max(250).optional(),
    dateOfBirth: z
      .string()
      .date()
      .optional(),
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({}),
});

export const loginSchema = z.object({
  body: z.object({
    identifier: z.string().trim().min(3).max(120),
    password: z.string().min(1).max(128),
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({}),
});
