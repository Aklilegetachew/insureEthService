import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';
import { authRepository } from '../modules/auth/auth.repository.js';
import type { SafeUser } from '../modules/auth/auth.types.js';
import { AppError } from '../utils/app-error.js';
import { asyncHandler } from '../utils/async-handler.js';

type JwtPayload = {
  sub: string;
  role: SafeUser['role'];
};

export const authenticate = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('Authentication token is required', 401);
  }

  const token = authHeader.slice('Bearer '.length);
  const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

  const user = await authRepository.findActiveUserById(decoded.sub);

  if (!user) {
    throw new AppError('Invalid or expired authentication token', 401);
  }

  req.user = user;
  next();
});

export const optionalAuthenticate = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }

  try {
    const token = authHeader.slice('Bearer '.length);
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    const user = await authRepository.findActiveUserById(decoded.sub);

    if (user) {
      req.user = user;
    }
  } catch {
    delete req.user;
  }

  next();
});
