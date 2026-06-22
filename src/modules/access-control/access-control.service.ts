import { UserRole } from '#database';

import { AppError } from '../../utils/app-error.js';
import type { SafeUser } from '../auth/auth.types.js';
import {
  defaultRoleAccess,
  normalizePermissions,
  permissionDefinitions,
  roleDefinitions,
  staffRoles,
} from './access-control.config.js';
import { accessControlRepository } from './access-control.repository.js';
import type { PermissionKey, RoleAccessConfig, StaffRole } from './access-control.types.js';

const assertSuperAdmin = (user: SafeUser) => {
  if (user.role !== UserRole.SUPER_ADMIN) {
    throw new AppError('Only super admins can configure role permissions', 403);
  }
};

const toRoleResponse = (config: RoleAccessConfig) =>
  roleDefinitions.map((role) => ({
    ...role,
    id: role.code,
    permissions: config[role.code].map((permissionCode) => {
      const definition = permissionDefinitions.find((permission) => permission.code === permissionCode);
      return definition
        ? { ...definition, id: definition.code }
        : {
            id: permissionCode,
            code: permissionCode,
            label: permissionCode,
            module: 'Custom',
            action: 'custom',
            description: permissionCode,
          };
    }),
  }));

export const accessControlService = {
  async getAccessControl() {
    const config = await accessControlRepository.seedDefaultsIfEmpty();

    return {
      roles: toRoleResponse(config),
      permissions: permissionDefinitions.map((permission) => ({ ...permission, id: permission.code })),
      config,
    };
  },

  async updateRolePermissions(user: SafeUser, role: StaffRole, permissions: string[]) {
    assertSuperAdmin(user);

    if (!staffRoles.includes(role)) {
      throw new AppError('Role not found', 404);
    }

    const normalized = normalizePermissions(role, permissions);
    const updatedPermissions = await accessControlRepository.replaceRolePermissions(role, normalized);
    const config = await accessControlRepository.findAllPermissions();
    config[role] = updatedPermissions as PermissionKey[];

    return {
      role: toRoleResponse(config).find((item) => item.code === role),
      config,
    };
  },

  async resetDefaults(user: SafeUser) {
    assertSuperAdmin(user);

    await Promise.all(
      staffRoles.map((role) => accessControlRepository.replaceRolePermissions(role, defaultRoleAccess[role])),
    );

    return this.getAccessControl();
  },

  async roleHasPermission(role: UserRole, permission: PermissionKey) {
    if (role === UserRole.SUPER_ADMIN) return true;
    if (role === UserRole.CUSTOMER) return false;

    const permissions = await accessControlRepository.seedDefaultsIfEmpty();
    return permissions[role].includes(permission);
  },

  async getPermissionsForRole(role: UserRole) {
    if (role === UserRole.CUSTOMER) return [];
    const config = await accessControlRepository.seedDefaultsIfEmpty();
    return config[role] ?? [];
  },
};
