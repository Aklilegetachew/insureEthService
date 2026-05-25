import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';

import { env } from '../../config/env.js';
import { AppError } from '../../utils/app-error.js';
import { authRepository } from './auth.repository.js';
import type { LoginInput, RegisterCustomerInput, SafeUser } from './auth.types.js';

const SALT_ROUNDS = 12;

const jwtSignOptions: SignOptions = {
  expiresIn: env.JWT_EXPIRES_IN as NonNullable<SignOptions['expiresIn']>,
};

const createAccessToken = (user: SafeUser) =>
  jwt.sign(
    {
      role: user.role,
    },
    env.JWT_SECRET,
    {
      ...jwtSignOptions,
      subject: user.id,
    },
  );

export const authService = {
  async registerCustomer(input: RegisterCustomerInput) {
    const existingUser = await authRepository.findExistingCustomer(
      input.email,
      input.phone,
      input.nationalId,
    );

    if (existingUser) {
      throw new AppError('A user with the provided email, phone, or national ID already exists', 409);
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const user = await authRepository.createCustomer(input, passwordHash);
    const token = createAccessToken(user);

    return { user, token };
  },

  async login(input: LoginInput) {
    const user = await authRepository.findByEmailOrPhone(input.identifier);

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    if (user.status !== 'ACTIVE') {
      throw new AppError('User account is not active', 403);
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    const safeUser = await authRepository.touchLastLogin(user.id);
    const token = createAccessToken(safeUser);

    return { user: safeUser, token };
  },

  async getCurrentUser(userId: string) {
    const user = await authRepository.findUserWithProfileById(userId);

    if (!user) {
      throw new AppError('Authenticated user was not found', 404);
    }

    return user;
  },
};
