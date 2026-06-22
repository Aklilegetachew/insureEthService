import { UserRole } from '#database';
import { z } from 'zod';

import { permissionDefinitions, staffRoles } from './access-control.config.js';

const staffRoleSchema = z.enum(staffRoles as [UserRole, ...UserRole[]]);
const permissionSchema = z.enum(permissionDefinitions.map((permission) => permission.code) as [string, ...string[]]);

export const roleCodeSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    role: staffRoleSchema,
  }),
  query: z.object({}).default({}),
});

export const updateRolePermissionsSchema = z.object({
  body: z.object({
    permissions: z.array(permissionSchema),
  }),
  params: z.object({
    role: staffRoleSchema,
  }),
  query: z.object({}).default({}),
});

export const emptyAccessControlSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({}).default({}),
  query: z.object({}).default({}),
});
