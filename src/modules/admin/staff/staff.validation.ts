import { UserRole, UserStatus } from '#database';
import { z } from 'zod';

const staffRoles = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.CLAIM_OFFICER,
  UserRole.FINANCE_OFFICER,
  UserRole.MANAGER,
  UserRole.BRANCH_MANAGER,
  UserRole.AGENT,
  UserRole.ASSESSOR,
] as const;

const staffRoleSchema = z.enum(staffRoles);

export const listStaffSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({}).default({}),
  query: z.object({
    search: z.string().trim().min(1).optional(),
    role: staffRoleSchema.optional(),
    status: z.nativeEnum(UserStatus).optional(),
  }),
});

export const staffIdSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({}).default({}),
});

export const createStaffSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(2).max(120),
    email: z.string().trim().email().toLowerCase(),
    phone: z.string().trim().min(7).max(30),
    role: staffRoleSchema,
    status: z.nativeEnum(UserStatus).optional(),
    temporaryPassword: z.string().min(8).max(128),
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({}),
});

export const updateStaffSchema = z.object({
  body: createStaffSchema.shape.body.partial().refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({}).default({}),
});

export const updateStaffStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(UserStatus),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({}).default({}),
});

export const resetStaffPasswordSchema = z.object({
  body: z.object({
    temporaryPassword: z.string().min(8).max(128).optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({}).default({}),
});

