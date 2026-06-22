import type { UserStatus } from '#database';

export type StaffRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'CLAIM_OFFICER'
  | 'FINANCE_OFFICER'
  | 'MANAGER'
  | 'BRANCH_MANAGER'
  | 'AGENT'
  | 'ASSESSOR';

export type StaffQuery = {
  search?: string;
  role?: StaffRole;
  status?: UserStatus;
};

export type StaffInput = {
  fullName: string;
  email: string;
  phone: string;
  role: StaffRole;
  status?: UserStatus;
  temporaryPassword: string;
};

export type UpdateStaffInput = Partial<Omit<StaffInput, 'temporaryPassword'>> & {
  temporaryPassword?: string;
};

export type StaffRecord = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: StaffRole;
  status: UserStatus;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  permissions: string[];
};
