import bcrypt from 'bcryptjs';

import { UserRole, UserStatus } from '../database/enums.js';
import { orm } from '../config/orm.js';

const required = (name: string) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
};

const fullName = process.env.ADMIN_FULL_NAME ?? 'Super Admin';
const email = required('ADMIN_EMAIL').toLowerCase();
const phone = required('ADMIN_PHONE');
const password = required('ADMIN_PASSWORD');

if (password.length < 8) {
  throw new Error('ADMIN_PASSWORD must be at least 8 characters');
}

const existing = await orm.user.findFirst({
  where: {
    OR: [{ email }, { phone }],
  },
  select: {
    id: true,
    email: true,
    phone: true,
    role: true,
  },
});

if (existing) {
  console.log(`Admin bootstrap skipped. User already exists: ${existing.email}`);
  await orm.$disconnect();
  process.exit(0);
}

const passwordHash = await bcrypt.hash(password, 12);

const admin = await orm.user.create({
  data: {
    fullName,
    email,
    phone,
    passwordHash,
    role: UserRole.SUPER_ADMIN,
    status: UserStatus.ACTIVE,
  },
  select: {
    id: true,
    fullName: true,
    email: true,
    phone: true,
    role: true,
    status: true,
  },
});

console.log(`Super admin created: ${admin.email}`);
await orm.$disconnect();
