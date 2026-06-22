import { UserRole } from '#database';

import { dataSource, initializeDatabase } from '../../config/database.js';
import { RolePermission } from '../../database/entities.js';
import { defaultRoleAccess, staffRoles } from './access-control.config.js';
import type { PermissionKey, RoleAccessConfig, StaffRole } from './access-control.types.js';

const repository = () => dataSource.getRepository(RolePermission);

const rowsToConfig = (rows: RolePermission[]): RoleAccessConfig => {
  const config = { ...defaultRoleAccess };

  staffRoles.forEach((role) => {
    if (role !== UserRole.SUPER_ADMIN) {
      config[role] = rows
        .filter((row) => row.role === role)
        .map((row) => row.permission as PermissionKey);
    }
  });

  config[UserRole.SUPER_ADMIN] = defaultRoleAccess[UserRole.SUPER_ADMIN];
  return config;
};

export const accessControlRepository = {
  async findAllPermissions() {
    await initializeDatabase();
    const rows = await repository().find({ order: { role: 'ASC', permission: 'ASC' } });
    return rowsToConfig(rows);
  },

  async findRolePermissions(role: StaffRole) {
    if (role === UserRole.SUPER_ADMIN) {
      return defaultRoleAccess[UserRole.SUPER_ADMIN];
    }

    await initializeDatabase();
    const rows = await repository().find({ where: { role }, order: { permission: 'ASC' } });
    return rows.map((row) => row.permission as PermissionKey);
  },

  async replaceRolePermissions(role: StaffRole, permissions: PermissionKey[]) {
    await initializeDatabase();
    await dataSource.transaction(async (manager) => {
      await manager.getRepository(RolePermission).delete({ role });
      if (role === UserRole.SUPER_ADMIN) return;

      await manager.getRepository(RolePermission).save(
        permissions.map((permission) =>
          manager.getRepository(RolePermission).create({
            role,
            permission,
          }),
        ),
      );
    });

    return this.findRolePermissions(role);
  },

  async seedDefaultsIfEmpty() {
    await initializeDatabase();
    const existingRows = await repository().find();
    const existingKeys = new Set(existingRows.map((row) => `${row.role}:${row.permission}`));
    const missingRows = staffRoles.flatMap((role) =>
      role === UserRole.SUPER_ADMIN
        ? []
        : defaultRoleAccess[role]
            .filter((permission) => !existingKeys.has(`${role}:${permission}`))
            .map((permission) =>
              repository().create({
                role,
                permission,
              }),
            ),
    );

    if (missingRows.length > 0) {
      await repository().save(missingRows);
    }

    return this.findAllPermissions();
  },
};
