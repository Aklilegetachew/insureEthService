import type { UserStatus } from '#database';

export type CustomerQuery = {
  search?: string;
  status?: UserStatus;
};

