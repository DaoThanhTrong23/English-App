import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../shared/http/api-error.js";
import { permissionService } from "../permission/permission.service.js";

export interface CreateRoleDto {
  name: string;
  description?: string;
  permissionIds?: number[];
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  permissionIds?: number[];
}

export class RoleService {
  /**
   * Danh sách tên các vai trò hệ thống cố định
   */
  private readonly SYSTEM_ROLES = ["admin", "user"];

  /**
   * Danh sách các module quyền dành riêng cho Web Admin (quản trị hệ thống)
   */
  readonly ADMIN_WEB_MODULES = [
    "student_manage",
    "word",
    "course",
    "topic",
    "test",
    "achievement",
    "activity_log",
    "dashboard",
    "keyword_setting",
    "topic_setting",
    "game",
    "notification",
    "ai",
    "role_manage",
  ];

  /**
   * Danh sách các module quyền mặc định bắt buộc (mọi vai trò đều luôn luôn có)
   */
  readonly DEFAULT_PROFILE_MODULES = ["auth", "profile"];

  /**
   * Kiểm tra xem một vai trò có phải vai trò hệ thống hay không
   */
  isSystemRole(role: { id: number; name: string }): boolean {
    return (
      role.id === 1 ||
      role.id === 2 ||
      this.SYSTEM_ROLES.includes(role.name.toLowerCase())
    );
  }

  /**
   * Lấy danh sách ID các quyền mặc định mà MỌI vai trò đều luôn luôn có (Auth & Profile)
   */
  async getDefaultProfilePermissionIds(): Promise<number[]> {
    const defaultPerms = await prisma.permission.findMany({
      where: {
        module: { in: this.DEFAULT_PROFILE_MODULES },
      },
      select: { id: true },
    });
    return defaultPerms.map((p) => p.id);
  }

  /**
   * Lấy danh sách ID các quyền hợp lệ của Web Admin
   */
  async getValidAdminPermissionIds(): Promise<number[]> {
    const adminPerms = await prisma.permission.findMany({
      where: {
        module: { in: this.ADMIN_WEB_MODULES },
      },
      select: { id: true },
    });
    return adminPerms.map((p) => p.id);
  }

  /**
   * Lấy toàn bộ danh sách vai trò
   * Kèm số lượng user, permissions và cờ isSystem
   */
  async getAllRoles() {
    const roles = await prisma.role.findMany({
      orderBy: { id: "asc" },
      include: {
        _count: {
          select: {
            users: true,
            permissions: true,
          },
        },
        permissions: {
          select: {
            id: true,
            name: true,
            description: true,
            module: true,
          },
        },
      },
    });

    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: this.isSystemRole(role),
      userCount: role._count.users,
      permissionCount: role._count.permissions,
      permissions: role.permissions,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    }));
  }

  /**
   * Lấy danh sách Permissions của Web Admin (dùng để chọn phân quyền cho Role mới)
   * Kèm thông tin các quyền Auth & Profile mặc định
   */
  async getAllPermissionsGrouped(adminOnly: boolean = true) {
    const whereClause = adminOnly
      ? { module: { in: this.ADMIN_WEB_MODULES } }
      : undefined;

    const permissions = await prisma.permission.findMany({
      where: whereClause,
      orderBy: [{ module: "asc" }, { id: "asc" }],
    });

    const defaultProfilePermissions = await prisma.permission.findMany({
      where: { module: { in: this.DEFAULT_PROFILE_MODULES } },
      orderBy: [{ module: "asc" }, { id: "asc" }],
    });

    const grouped: Record<string, typeof permissions> = {};
    for (const perm of permissions) {
      if (!grouped[perm.module]) {
        grouped[perm.module] = [];
      }
      grouped[perm.module].push(perm);
    }

    return {
      total: permissions.length,
      grouped,
      list: permissions,
      defaultPermissions: defaultProfilePermissions,
    };
  }

  /**
   * Lấy chi tiết một vai trò theo ID
   */
  async getRoleById(id: number) {
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            permissions: true,
          },
        },
        permissions: {
          select: {
            id: true,
            name: true,
            description: true,
            module: true,
          },
        },
      },
    });

    if (!role) {
      throw new ApiError(404, "not_found", `Không tìm thấy vai trò có ID ${id}`);
    }

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: this.isSystemRole(role),
      userCount: role._count.users,
      permissionCount: role._count.permissions,
      permissions: role.permissions,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }

  /**
   * Tự động bổ sung quyền READ tương ứng khi có ít nhất 1 quyền Action (Create/Update/Delete)
   * của module đó được chọn, và tự động loại bỏ quyền READ nếu không có action nào được chọn.
   */
  async syncAutoReadPermissions(permissionIds: number[]): Promise<number[]> {
    const adminPerms = await prisma.permission.findMany({
      where: { module: { in: this.ADMIN_WEB_MODULES } },
      select: { id: true, name: true, module: true },
    });

    const permsByModule = new Map<string, typeof adminPerms>();
    for (const p of adminPerms) {
      if (!permsByModule.has(p.module)) permsByModule.set(p.module, []);
      permsByModule.get(p.module)!.push(p);
    }

    const selectedSet = new Set(permissionIds);

    for (const [, modulePerms] of permsByModule.entries()) {
      const actionPerms = modulePerms.filter((p) => !p.name.startsWith("READ_"));
      const readPerms = modulePerms.filter((p) => p.name.startsWith("READ_"));

      // Nếu module có các quyền action (thêm, sửa, xóa)
      if (actionPerms.length > 0) {
        const hasAction = actionPerms.some((p) => selectedSet.has(p.id));
        if (hasAction) {
          // Tự động kích hoạt toàn bộ quyền READ của module này
          for (const r of readPerms) selectedSet.add(r.id);
        } else {
          // Tự động bỏ toàn bộ quyền READ của module này nếu không có action nào
          for (const r of readPerms) selectedSet.delete(r.id);
        }
      }
    }

    return Array.from(selectedSet);
  }

  /**
   * Tạo vai trò mới (Không được trùng tên với admin, user hoặc role đã tồn tại)
   */
  async createRole(dto: CreateRoleDto) {
    const trimmedName = dto.name?.trim();
    if (!trimmedName) {
      throw new ApiError(400, "bad_request", "Tên vai trò không được để trống");
    }

    if (this.SYSTEM_ROLES.includes(trimmedName.toLowerCase())) {
      throw new ApiError(
        400,
        "bad_request",
        `Không thể đặt tên vai trò trùng với vai trò hệ thống ('admin', 'user')`
      );
    }

    const existingRole = await prisma.role.findUnique({
      where: { name: trimmedName },
    });

    if (existingRole) {
      throw new ApiError(
        409,
        "conflict",
        `Vai trò với tên '${trimmedName}' đã tồn tại trong hệ thống`
      );
    }

    // 1. Luôn tự động cấp các quyền mặc định Profile & Auth cho mọi vai trò
    const defaultProfileIds = await this.getDefaultProfilePermissionIds();

    // 2. Chỉ cho phép gán các quyền thuộc phạm vi Web Admin
    const validAdminIds = new Set(await this.getValidAdminPermissionIds());
    const filteredAdminIds = (dto.permissionIds || []).filter((id) => validAdminIds.has(id));

    // 3. Tự động đồng bộ quyền READ cho các tài nguyên có quyền Action được chọn
    const syncedAdminIds = await this.syncAutoReadPermissions(filteredAdminIds);

    // Danh sách quyền cuối cùng được gán
    const finalPermissionIds = Array.from(new Set([...defaultProfileIds, ...syncedAdminIds]));

    const newRole = await prisma.role.create({
      data: {
        name: trimmedName,
        description: dto.description?.trim() || null,
        permissions: {
          connect: finalPermissionIds.map((id) => ({ id })),
        },
      },
      include: {
        permissions: {
          select: {
            id: true,
            name: true,
            description: true,
            module: true,
          },
        },
        _count: {
          select: {
            permissions: true,
            users: true,
          },
        },
      },
    });

    permissionService.clearCache();

    return {
      id: newRole.id,
      name: newRole.name,
      description: newRole.description,
      isSystem: false,
      userCount: newRole._count.users,
      permissionCount: newRole._count.permissions,
      permissions: newRole.permissions,
      createdAt: newRole.createdAt,
      updatedAt: newRole.updatedAt,
    };
  }

  /**
   * Cập nhật vai trò (Chỉ áp dụng cho custom roles, chặn admin và user)
   */
  async updateRole(id: number, dto: UpdateRoleDto) {
    const existing = await prisma.role.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new ApiError(404, "not_found", `Không tìm thấy vai trò có ID ${id}`);
    }

    // Kiểm tra bảo vệ vai trò mặc định
    if (this.isSystemRole(existing)) {
      throw new ApiError(
        403,
        "forbidden",
        `Vai trò '${existing.name}' là vai trò mặc định của hệ thống, chỉ hiển thị và không được phép chỉnh sửa!`
      );
    }

    const dataToUpdate: any = {};

    if (dto.name !== undefined) {
      const trimmedName = dto.name.trim();
      if (!trimmedName) {
        throw new ApiError(400, "bad_request", "Tên vai trò không được để trống");
      }

      if (this.SYSTEM_ROLES.includes(trimmedName.toLowerCase())) {
        throw new ApiError(
          400,
          "bad_request",
          `Không thể đổi tên vai trò thành '${trimmedName}' vì đây là vai trò hệ thống`
        );
      }

      if (trimmedName.toLowerCase() !== existing.name.toLowerCase()) {
        const nameDuplicate = await prisma.role.findUnique({
          where: { name: trimmedName },
        });
        if (nameDuplicate) {
          throw new ApiError(
            409,
            "conflict",
            `Vai trò với tên '${trimmedName}' đã được sử dụng bởi vai trò khác`
          );
        }
      }

      dataToUpdate.name = trimmedName;
    }

    if (dto.description !== undefined) {
      dataToUpdate.description = dto.description?.trim() || null;
    }

    if (Array.isArray(dto.permissionIds)) {
      // 1. Luôn bảo lưu các quyền mặc định Profile & Auth cho mọi vai trò
      const defaultProfileIds = await this.getDefaultProfilePermissionIds();

      // 2. Chỉ cho phép gán các quyền thuộc phạm vi Web Admin
      const validAdminIds = new Set(await this.getValidAdminPermissionIds());
      const filteredAdminIds = dto.permissionIds.filter((id) => validAdminIds.has(id));

      // 3. Tự động đồng bộ quyền READ cho các tài nguyên có quyền Action được chọn
      const syncedAdminIds = await this.syncAutoReadPermissions(filteredAdminIds);

      const finalPermissionIds = Array.from(new Set([...defaultProfileIds, ...syncedAdminIds]));

      dataToUpdate.permissions = {
        set: finalPermissionIds.map((pid) => ({ id: pid })),
      };
    }

    const updatedRole = await prisma.role.update({
      where: { id },
      data: dataToUpdate,
      include: {
        permissions: {
          select: {
            id: true,
            name: true,
            description: true,
            module: true,
          },
        },
        _count: {
          select: {
            permissions: true,
            users: true,
          },
        },
      },
    });

    permissionService.clearCache();

    return {
      id: updatedRole.id,
      name: updatedRole.name,
      description: updatedRole.description,
      isSystem: false,
      userCount: updatedRole._count.users,
      permissionCount: updatedRole._count.permissions,
      permissions: updatedRole.permissions,
      createdAt: updatedRole.createdAt,
      updatedAt: updatedRole.updatedAt,
    };
  }

  /**
   * Xóa vai trò (Chỉ áp dụng cho custom roles, chặn admin và user)
   */
  async deleteRole(id: number) {
    const existing = await prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!existing) {
      throw new ApiError(404, "not_found", `Không tìm thấy vai trò có ID ${id}`);
    }

    // Kiểm tra bảo vệ vai trò mặc định
    if (this.isSystemRole(existing)) {
      throw new ApiError(
        403,
        "forbidden",
        `Vai trò '${existing.name}' là vai trò mặc định của hệ thống, không thể xóa!`
      );
    }

    // Kiểm tra xem có người dùng nào đang gán role này không
    if (existing._count.users > 0) {
      throw new ApiError(
        400,
        "bad_request",
        `Không thể xóa vai trò '${existing.name}' vì đang có ${existing._count.users} người dùng được gán vai trò này. Vui lòng chuyển các người dùng sang vai trò khác trước khi xóa!`
      );
    }

    await prisma.role.delete({
      where: { id },
    });

    permissionService.clearCache();

    return {
      success: true,
      message: `Đã xóa vai trò '${existing.name}' thành công`,
    };
  }
}

export const roleService = new RoleService();
