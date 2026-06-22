import type { UserRole } from '#database';

export type PermissionKey =
  | 'dashboard.view'
  | 'customers.view'
  | 'customers.manage'
  | 'products.view'
  | 'products.manage'
  | 'quotations.view'
  | 'quotations.review'
  | 'quotations.finance_review'
  | 'quotations.manager_review'
  | 'quotations.branch_review'
  | 'policies.view'
  | 'policies.manage'
  | 'payments.view'
  | 'payments.verify'
  | 'claims.view'
  | 'claims.review'
  | 'claims.settle'
  | 'documents.view'
  | 'documents.review'
  | 'reports.view'
  | 'notifications.view'
  | 'staff.view'
  | 'staff.create'
  | 'staff.edit'
  | 'staff.status'
  | 'staff.reset_password'
  | 'roles.view'
  | 'roles.configure';

export type StaffRole = Exclude<UserRole, UserRole.CUSTOMER>;

export type RoleAccessConfig = Record<StaffRole, PermissionKey[]>;

export type PermissionDefinition = {
  code: PermissionKey;
  label: string;
  module: string;
  action: string;
  description: string;
};

export type RoleDefinition = {
  code: StaffRole;
  name: string;
  description: string;
  isSystem: true;
};
