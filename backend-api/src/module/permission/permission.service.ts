import { prisma } from "../../config/prisma.js";
import { PermissionName } from "../../generated/prisma/index.js";
import { ALL_PERMISSIONS, USER_PERMISSIONS, ADMIN_PERMISSIONS } from "./permission.constants.js";
import { loggers } from "../../utils/logger.js";

export class PermissionService {
  // In-memory cache: Role name -> Set of Permission Names
  private rolePermissionsCache: Map<string, { permissions: Set<PermissionName>; timestamp: number }> = new Map();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 phút

  /**
   * Khởi tạo Roles và Permissions trong Database:
   * 1. Upsert toàn bộ permissions theo ALL_PERMISSIONS
   * 2. Tạo sẵn role 'admin' và role 'user'
   * 3. Gán khối permission tương ứng cho từng role
   */
  async initRolesAndPermissions(): Promise<void> {
    try {
      loggers.info("Bắt đầu khởi tạo/cập nhật Roles và Permissions...");

      // 1. Tạo/cập nhật từng permission trong DB
      for (const def of ALL_PERMISSIONS) {
        await prisma.permission.upsert({
          where: { name: def.name },
          update: {
            description: def.description,
            module: def.module,
          },
          create: {
            name: def.name,
            description: def.description,
            module: def.module,
          },
        });
      }

      // Lấy toàn bộ permissions từ DB để lấy id chính xác
      const dbPermissions = await prisma.permission.findMany();
      const permMap = new Map<PermissionName, number>();
      for (const p of dbPermissions) {
        permMap.set(p.name as PermissionName, p.id);
      }

      // 2. Tạo hoặc cập nhật Role 'admin'
      const adminPermIds = ADMIN_PERMISSIONS
        .map((name) => permMap.get(name))
        .filter((id): id is number => id !== undefined);

      await prisma.role.upsert({
        where: { name: "admin" },
        update: {
          description: "Quản trị viên toàn quyền hệ thống",
          permissions: {
            set: adminPermIds.map((id) => ({ id })),
          },
        },
        create: {
          id: 1,
          name: "admin",
          description: "Quản trị viên toàn quyền hệ thống",
          permissions: {
            connect: adminPermIds.map((id) => ({ id })),
          },
        },
      });

      // 3. Tạo hoặc cập nhật Role 'user'
      const userPermIds = USER_PERMISSIONS
        .map((name) => permMap.get(name))
        .filter((id): id is number => id !== undefined);

      await prisma.role.upsert({
        where: { name: "user" },
        update: {
          description: "Học viên / Người dùng hệ thống",
          permissions: {
            set: userPermIds.map((id) => ({ id })),
          },
        },
        create: {
          id: 2,
          name: "user",
          description: "Học viên / Người dùng hệ thống",
          permissions: {
            connect: userPermIds.map((id) => ({ id })),
          },
        },
      });

      this.clearCache();
      loggers.info("Khởi tạo Roles và Permissions thành công!");
    } catch (error) {
      loggers.error("Lỗi khi khởi tạo Roles và Permissions: " + (error as any)?.message);
    }
  }

  /**
   * Lấy danh sách permission của 1 role (có cache)
   */
  async getPermissionsByRole(roleName: string): Promise<Set<PermissionName>> {
    const cached = this.rolePermissionsCache.get(roleName);
    const now = Date.now();

    if (cached && (now - cached.timestamp < this.CACHE_TTL_MS)) {
      return cached.permissions;
    }

    const role = await prisma.role.findUnique({
      where: { name: roleName },
      include: {
        permissions: true,
      },
    });

    const permSet = new Set<PermissionName>();
    if (role && role.permissions) {
      for (const p of role.permissions) {
        permSet.add(p.name as PermissionName);
      }
    } else if (roleName === "admin") {
      // Fallback nếu DB chưa kịp link
      for (const p of ADMIN_PERMISSIONS) permSet.add(p);
    } else if (roleName === "user") {
      for (const p of USER_PERMISSIONS) permSet.add(p);
    }

    this.rolePermissionsCache.set(roleName, {
      permissions: permSet,
      timestamp: now,
    });

    return permSet;
  }

  /**
   * Kiểm tra role có quyền permissionName hay không
   */
  async hasPermission(roleName: string, permissionName: PermissionName): Promise<boolean> {
    if (!roleName) return false;
    const permissions = await this.getPermissionsByRole(roleName);
    return permissions.has(permissionName);
  }

  /**
   * Lấy toàn bộ permission của user theo ID
   */
  async getUserPermissions(userId: number): Promise<PermissionName[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!user || !user.role) return [];
    return user.role.permissions.map((p) => p.name as PermissionName);
  }

  /**
   * Xóa cache permissions
   */
  clearCache(): void {
    this.rolePermissionsCache.clear();
  }
}

export const permissionService = new PermissionService();
