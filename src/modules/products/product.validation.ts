import { ProductStatus } from '#database';
import { z } from 'zod';

const optionalPositiveNumber = z.coerce.number().positive().optional();

const requiredDocumentsSchema = z.union([
  z.array(z.string().trim().min(1)),
  z.record(z.string(), z.unknown()),
]);

export const listProductsSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({}).default({}),
  query: z.object({
    status: z.nativeEnum(ProductStatus).optional(),
    category: z.string().trim().min(1).optional(),
    search: z.string().trim().min(1).optional(),
  }),
});

export const productIdSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({}).default({}),
});

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(150),
    code: z.string().trim().min(1).max(50).toUpperCase(),
    description: z.string().trim().max(1000).optional(),
    category: z.string().trim().min(1).max(100),
    status: z.nativeEnum(ProductStatus).optional(),
    basePremium: optionalPositiveNumber,
    premiumRate: optionalPositiveNumber,
    coverageDescription: z.string().trim().max(2000).optional(),
    requiredDocuments: requiredDocumentsSchema.optional(),
    termsAndConditions: z.string().trim().max(5000).optional(),
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({}),
});

export const updateProductSchema = z.object({
  body: createProductSchema.shape.body.partial().refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({}).default({}),
});
