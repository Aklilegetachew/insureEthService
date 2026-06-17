import type { CustomerProfileModel as CustomerProfile, UserModel as User } from '#database';

export type SafeUser = Omit<User, 'passwordHash'>;

export type SafeUserWithCustomerProfile = SafeUser & {
  customerProfile: CustomerProfile | null;
};

export type RegisterCustomerInput = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  nationalId?: string;
  address?: string;
  dateOfBirth?: string;
};

export type LoginInput = {
  identifier: string;
  password: string;
};
