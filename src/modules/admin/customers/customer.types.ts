import type { UserStatus } from '@prisma/client';

export type CustomerQuery = {
  search?: string;
  status?: UserStatus;
};

