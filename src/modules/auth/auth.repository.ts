import { UserRole, UserStatus } from '#database';

import { orm } from '../../config/orm.js';
import type { RegisterCustomerInput } from './auth.types.js';

const userSelect = {
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

const userWithPasswordSelect = {
  ...userSelect,
  passwordHash: true,
} as const;

export const authRepository = {
  findByEmailOrPhone(identifier: string) {
    return orm.user.findFirst({
      where: {
        OR: [{ email: identifier.toLowerCase() }, { phone: identifier }],
      },
      select: userWithPasswordSelect,
    });
  },

  findExistingCustomer(email: string, phone: string, nationalId?: string) {
    return orm.user.findFirst({
      where: {
        OR: [
          { email },
          { phone },
          ...(nationalId
            ? [
                {
                  customerProfile: {
                    nationalId,
                  },
                },
              ]
            : []),
        ],
      },
      select: {
        id: true,
        email: true,
        phone: true,
        customerProfile: {
          select: {
            nationalId: true,
          },
        },
      },
    });
  },

  createCustomer(input: RegisterCustomerInput, passwordHash: string) {
    const customerProfileData = {
      ...(input.nationalId ? { nationalId: input.nationalId } : {}),
      ...(input.address ? { address: input.address } : {}),
      ...(input.dateOfBirth ? { dateOfBirth: new Date(input.dateOfBirth) } : {}),
    };

    return orm.user.create({
      data: {
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        passwordHash,
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        customerProfile: {
          create: customerProfileData,
        },
      },
      select: {
        ...userSelect,
        customerProfile: true,
      },
    });
  },

  findActiveUserById(id: string) {
    return orm.user.findFirst({
      where: {
        id,
        status: UserStatus.ACTIVE,
      },
      select: userSelect,
    });
  },

  findUserWithProfileById(id: string) {
    return orm.user.findUnique({
      where: { id },
      select: {
        ...userSelect,
        customerProfile: true,
      },
    });
  },

  touchLastLogin(id: string) {
    return orm.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
      select: userSelect,
    });
  },
};
