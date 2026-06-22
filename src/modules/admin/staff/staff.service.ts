import bcrypt from 'bcryptjs';
import { Orm, UserRole, UserStatus } from '#database';

import { AppError } from '../../../utils/app-error.js';
import type { SafeUser } from '../../auth/auth.types.js';
import { accessControlService } from '../../access-control/access-control.service.js';
import { staffRepository } from './staff.repository.js';
import type { StaffInput, StaffQuery, UpdateStaffInput } from './staff.types.js';

const SALT_ROUNDS = 12;

const handleormError = (error: unknown): never => {
  if (error instanceof Orm.KnownRequestError) {
    if (error.code === 'P2025') {
      throw new AppError('Staff member not found', 404);
    }

    if (error.code === 'P2002') {
      throw new AppError('Email or phone already exists', 409);
    }
  }

  throw error;
};

const enrichStaff = async <T extends { role: UserRole } & Record<string, unknown>>(staff: T) => ({
  ...staff,
  permissions: await accessControlService.getPermissionsForRole(staff.role),
});

const generateTemporaryPassword = () =>
  `Temp-${Math.floor(100000 + Math.random() * 900000)}!`;

export const staffService = {
  async listStaff(_user: SafeUser, query: StaffQuery) {
    const items = await staffRepository.findMany(query);
    return Promise.all(items.map(enrichStaff));
  },

  async getStaff(user: SafeUser, staffId: string) {
    const staff = await staffRepository.findById(staffId);

    if (!staff) {
      throw new AppError('Staff member not found', 404);
    }

    return enrichStaff(staff);
  },

  async createStaff(user: SafeUser, input: StaffInput) {
    const passwordHash = await bcrypt.hash(input.temporaryPassword, SALT_ROUNDS);

    try {
      const staff = await staffRepository.create(input, passwordHash);
      return enrichStaff(staff);
    } catch (error) {
      handleormError(error);
    }
  },

  async updateStaff(user: SafeUser, staffId: string, input: UpdateStaffInput) {
    const passwordHash = input.temporaryPassword
      ? await bcrypt.hash(input.temporaryPassword, SALT_ROUNDS)
      : undefined;

    try {
      const staff = await staffRepository.update(staffId, input, passwordHash);
      return enrichStaff(staff);
    } catch (error) {
      handleormError(error);
    }
  },

  async updateStatus(user: SafeUser, staffId: string, status: UserStatus) {
    try {
      const staff = await staffRepository.updateStatus(staffId, status);
      return enrichStaff(staff);
    } catch (error) {
      handleormError(error);
    }
  },

  async resetPassword(user: SafeUser, staffId: string, temporaryPassword?: string) {
    const nextPassword = temporaryPassword?.trim() || generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(nextPassword, SALT_ROUNDS);

    try {
      const staff = await staffRepository.update(staffId, {}, passwordHash);
      return {
        staff: enrichStaff(staff),
        temporaryPassword: nextPassword,
      };
    } catch (error) {
      handleormError(error);
    }
  },
};

