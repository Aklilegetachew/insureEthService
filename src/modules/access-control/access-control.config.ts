import { UserRole } from '#database';

import type { PermissionDefinition, PermissionKey, RoleAccessConfig, RoleDefinition, StaffRole } from './access-control.types.js';

export const staffRoles = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.CLAIM_OFFICER,
  UserRole.FINANCE_OFFICER,
  UserRole.MANAGER,
  UserRole.BRANCH_MANAGER,
  UserRole.AGENT,
  UserRole.ASSESSOR,
] as StaffRole[];

export const permissionDefinitions: PermissionDefinition[] = [
  { code: 'dashboard.view', label: 'View dashboard', module: 'Overview', action: 'view', description: 'Open the admin dashboard.' },
  { code: 'customers.view', label: 'View customers', module: 'Customers', action: 'view', description: 'Read customer profiles and account history.' },
  { code: 'customers.manage', label: 'Manage customers', module: 'Customers', action: 'manage', description: 'Update customer records and account details.' },
  { code: 'products.view', label: 'View products', module: 'Products', action: 'view', description: 'Read insurance products and coverage setup.' },
  { code: 'products.manage', label: 'Manage products', module: 'Products', action: 'manage', description: 'Create, update, and deactivate products.' },
  { code: 'quotations.view', label: 'View quotations', module: 'Quotations', action: 'view', description: 'Read quotation requests and calculated premiums.' },
  { code: 'quotations.review', label: 'Review quotations', module: 'Quotations', action: 'review', description: 'Approve, reject, or annotate quotation requests.' },
  { code: 'quotations.finance_review', label: 'Finance approval', module: 'Quotations', action: 'finance_review', description: 'Perform the first quotation approval and confirm premium.' },
  { code: 'quotations.manager_review', label: 'Manager approval', module: 'Quotations', action: 'manager_review', description: 'Perform the second quotation approval after finance review.' },
  { code: 'quotations.branch_review', label: 'Branch approval', module: 'Quotations', action: 'branch_review', description: 'Perform final branch approval and create the policy.' },
  { code: 'policies.view', label: 'View policies', module: 'Policies', action: 'view', description: 'Read issued policies and coverage lifecycle.' },
  { code: 'policies.manage', label: 'Manage policies', module: 'Policies', action: 'manage', description: 'Update policy status and policy data.' },
  { code: 'payments.view', label: 'View payments', module: 'Payments', action: 'view', description: 'Read payment records and proof details.' },
  { code: 'payments.verify', label: 'Verify payments', module: 'Payments', action: 'verify', description: 'Approve or reject payment evidence.' },
  { code: 'claims.view', label: 'View claims', module: 'Claims', action: 'view', description: 'Read claim files and incident details.' },
  { code: 'claims.review', label: 'Review claims', module: 'Claims', action: 'review', description: 'Move claims through review and assessment.' },
  { code: 'claims.settle', label: 'Settle claims', module: 'Claims', action: 'settle', description: 'Approve settlements and close claim workflows.' },
  { code: 'documents.view', label: 'View documents', module: 'Documents', action: 'view', description: 'Read uploaded files and ownership links.' },
  { code: 'documents.review', label: 'Review documents', module: 'Documents', action: 'review', description: 'Approve or reject uploaded documents.' },
  { code: 'reports.view', label: 'View reports', module: 'Reports', action: 'view', description: 'Open operational reports and analytics.' },
  { code: 'notifications.view', label: 'View notifications', module: 'Notifications', action: 'view', description: 'Read staff alerts and reminders.' },
  { code: 'staff.view', label: 'View staff', module: 'Staff', action: 'view', description: 'Read internal staff accounts.' },
  { code: 'staff.create', label: 'Create staff', module: 'Staff', action: 'create', description: 'Create internal staff accounts.' },
  { code: 'staff.edit', label: 'Edit staff', module: 'Staff', action: 'edit', description: 'Update staff identity, role, and status.' },
  { code: 'staff.status', label: 'Change staff status', module: 'Staff', action: 'status', description: 'Activate, deactivate, or suspend staff accounts.' },
  { code: 'staff.reset_password', label: 'Reset staff passwords', module: 'Staff', action: 'reset_password', description: 'Generate temporary staff passwords.' },
  { code: 'roles.view', label: 'View roles', module: 'Roles', action: 'view', description: 'Read role definitions and permission coverage.' },
  { code: 'roles.configure', label: 'Configure roles', module: 'Roles', action: 'configure', description: 'Change role access and action availability.' },
];

const allPermissions = permissionDefinitions.map((permission) => permission.code);

export const defaultRoleAccess: RoleAccessConfig = {
  [UserRole.SUPER_ADMIN]: allPermissions,
  [UserRole.ADMIN]: [
    'dashboard.view',
    'customers.view',
    'customers.manage',
    'products.view',
    'products.manage',
    'quotations.view',
    'policies.view',
    'policies.manage',
    'payments.view',
    'claims.view',
    'documents.view',
    'documents.review',
    'reports.view',
    'notifications.view',
    'staff.view',
  ],
  [UserRole.MANAGER]: [
    'dashboard.view',
    'customers.view',
    'products.view',
    'quotations.view',
    'quotations.review',
    'quotations.manager_review',
    'policies.view',
    'payments.view',
    'claims.view',
    'claims.review',
    'documents.view',
    'reports.view',
    'notifications.view',
    'staff.view',
  ],
  [UserRole.BRANCH_MANAGER]: [
    'dashboard.view',
    'customers.view',
    'products.view',
    'quotations.view',
    'quotations.review',
    'quotations.branch_review',
    'policies.view',
    'policies.manage',
    'payments.view',
    'claims.view',
    'documents.view',
    'reports.view',
    'notifications.view',
  ],
  [UserRole.CLAIM_OFFICER]: ['dashboard.view', 'claims.view', 'claims.review', 'documents.view', 'documents.review', 'notifications.view'],
  [UserRole.FINANCE_OFFICER]: ['dashboard.view', 'quotations.view', 'quotations.review', 'quotations.finance_review', 'payments.view', 'payments.verify', 'policies.view', 'policies.manage', 'reports.view', 'notifications.view'],
  [UserRole.AGENT]: ['dashboard.view', 'customers.view', 'products.view', 'quotations.view', 'policies.view', 'notifications.view'],
  [UserRole.ASSESSOR]: ['dashboard.view', 'claims.view', 'claims.review', 'documents.view', 'notifications.view'],
};

export const roleDefinitions: RoleDefinition[] = [
  { code: UserRole.SUPER_ADMIN, name: 'Super Admin', description: 'Full ownership of access control, staff, and all operations.', isSystem: true },
  { code: UserRole.ADMIN, name: 'Admin', description: 'Runs core operations across customers, products, and workflow queues.', isSystem: true },
  { code: UserRole.MANAGER, name: 'Manager', description: 'Supervises teams, reviews queues, and reads operational reports.', isSystem: true },
  { code: UserRole.BRANCH_MANAGER, name: 'Branch Manager', description: 'Gives final branch approval before a quotation becomes a policy.', isSystem: true },
  { code: UserRole.CLAIM_OFFICER, name: 'Claim Officer', description: 'Handles claim intake, document review, and claim status movement.', isSystem: true },
  { code: UserRole.FINANCE_OFFICER, name: 'Finance Officer', description: 'Verifies payments and manages finance-side policy actions.', isSystem: true },
  { code: UserRole.ASSESSOR, name: 'Assessor', description: 'Reviews claim assessments and damage estimates.', isSystem: true },
  { code: UserRole.AGENT, name: 'Agent', description: 'Supports customer onboarding, quotation follow-up, and sales workflows.', isSystem: true },
];

export const validPermissionCodes = new Set(permissionDefinitions.map((permission) => permission.code));

export const normalizePermissions = (role: StaffRole, permissions: string[]) => {
  if (role === UserRole.SUPER_ADMIN) {
    return defaultRoleAccess[UserRole.SUPER_ADMIN];
  }

  return Array.from(
    new Set(permissions.filter((permission): permission is PermissionKey => validPermissionCodes.has(permission as PermissionKey))),
  );
};
