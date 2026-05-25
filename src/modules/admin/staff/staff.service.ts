import bcrypt from 'bcryptjs';
import { Prisma, UserRole, UserStatus } from '@prisma/client';

import { AppError } from '../../../utils/app-error.js';
import type { SafeUser } from '../../auth/auth.types.js';
import { staffRepository } from './staff.repository.js';
import type { StaffInput, StaffQuery, UpdateStaffInput } from './staff.types.js';

const SALT_ROUNDS = 12;

const staffPermissionsByRole: Record<string, string[]> = {
  SUPER_ADMIN: ['manage_staff', 'manage_roles', 'full_system_access'],
  ADMIN: ['manage_customers', 'manage_products', 'manage_operations'],
  MANAGER: ['review_queues', 'view_reports', 'approve_work_items'],
  CLAIM_OFFICER: ['review_claims', 'request_documents', 'update_claim_status'],
  FINANCE_OFFICER: ['verify_payments', 'reject_payments', 'activate_policies'],
  AGENT: ['assist_quotations', 'support_customers'],
  ASSESSOR: ['review_assessments', 'submit_damage_estimates'],
};

const assertSuperAdmin = (user: SafeUser) => {
  if (user.role !== UserRole.SUPER_ADMIN) {
    throw new AppError('Only super admins can manage staff accounts', 403);
  }
};

const handlePrismaError = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2025') {
      throw new AppError('Staff member not found', 404);
    }

    if (error.code === 'P2002') {
      throw new AppError('Email or phone already exists', 409);
    }
  }

  throw error;
};

const enrichStaff = <T extends { role: string } & Record<string, unknown>>(staff: T) => ({
  ...staff,
  permissions: staffPermissionsByRole[staff.role] ?? [],
});

const generateTemporaryPassword = () =>
  `Temp-${Math.floor(100000 + Math.random() * 900000)}!`;

export const staffService = {
  listStaff(user: SafeUser, query: StaffQuery) {
    assertSuperAdmin(user);
    return staffRepository.findMany(query).then((items) => items.map(enrichStaff));
  },

  async getStaff(user: SafeUser, staffId: string) {
    assertSuperAdmin(user);

    const staff = await staffRepository.findById(staffId);

    if (!staff) {
      throw new AppError('Staff member not found', 404);
    }

    return enrichStaff(staff);
  },

  async createStaff(user: SafeUser, input: StaffInput) {
    assertSuperAdmin(user);

    const passwordHash = await bcrypt.hash(input.temporaryPassword, SALT_ROUNDS);

    try {
      const staff = await staffRepository.create(input, passwordHash);
      return enrichStaff(staff);
    } catch (error) {
      handlePrismaError(error);
    }
  },

  async updateStaff(user: SafeUser, staffId: string, input: UpdateStaffInput) {
    assertSuperAdmin(user);

    const passwordHash = input.temporaryPassword
      ? await bcrypt.hash(input.temporaryPassword, SALT_ROUNDS)
      : undefined;

    try {
      const staff = await staffRepository.update(staffId, input, passwordHash);
      return enrichStaff(staff);
    } catch (error) {
      handlePrismaError(error);
    }
  },

  async updateStatus(user: SafeUser, staffId: string, status: UserStatus) {
    assertSuperAdmin(user);

    try {
      const staff = await staffRepository.updateStatus(staffId, status);
      return enrichStaff(staff);
    } catch (error) {
      handlePrismaError(error);
    }
  },

  async resetPassword(user: SafeUser, staffId: string, temporaryPassword?: string) {
    assertSuperAdmin(user);

    const nextPassword = temporaryPassword?.trim() || generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(nextPassword, SALT_ROUNDS);

    try {
      const staff = await staffRepository.update(staffId, {}, passwordHash);
      return {
        staff: enrichStaff(staff),
        temporaryPassword: nextPassword,
      };
    } catch (error) {
      handlePrismaError(error);
    }
  },
};

