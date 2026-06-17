import { UserRole, UserStatus } from '#database';

import { orm } from '../../../config/orm.js';
import type { StaffInput, StaffQuery, UpdateStaffInput } from './staff.types.js';

const staffSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  role: true,
  status: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

const staffWhere = (query: StaffQuery) => ({
  role: {
    not: UserRole.CUSTOMER,
  },
  ...(query.role ? { role: query.role } : {}),
  ...(query.status ? { status: query.status } : {}),
  ...(query.search
    ? {
        OR: [
          { fullName: { contains: query.search, mode: 'insensitive' as const } },
          { email: { contains: query.search, mode: 'insensitive' as const } },
          { phone: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }
    : {}),
});

export const staffRepository = {
  findMany(query: StaffQuery) {
    return orm.user.findMany({
      where: staffWhere(query),
      select: staffSelect,
      orderBy: { createdAt: 'desc' },
    });
  },

  findById(id: string) {
    return orm.user.findFirst({
      where: {
        id,
        role: {
          not: UserRole.CUSTOMER,
        },
      },
      select: {
        ...staffSelect,
        customerProfile: true,
      },
    });
  },

  create(input: StaffInput, passwordHash: string) {
    return orm.user.create({
      data: {
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        role: input.role,
        status: input.status ?? UserStatus.ACTIVE,
        passwordHash,
      },
      select: staffSelect,
    });
  },

  update(id: string, input: UpdateStaffInput, passwordHash?: string) {
    return orm.user.update({
      where: { id },
      data: {
        ...(input.fullName ? { fullName: input.fullName } : {}),
        ...(input.email ? { email: input.email } : {}),
        ...(input.phone ? { phone: input.phone } : {}),
        ...(input.role ? { role: input.role } : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(passwordHash ? { passwordHash } : {}),
      },
      select: staffSelect,
    });
  },

  updateStatus(id: string, status: UserStatus) {
    return orm.user.update({
      where: { id },
      data: { status },
      select: staffSelect,
    });
  },
};

