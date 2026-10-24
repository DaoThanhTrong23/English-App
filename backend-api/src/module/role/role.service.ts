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
   * Lấy danh sách toàn bộ Permissions trong hệ thống
   * Nhóm theo module để hiển thị checkbox phân quyền trên Frontend
   */
  async getAllPermissionsGrouped() {
    const permissions = await prisma.permission.findMany({
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

    // Validate permissionIds nếu có truyền lên
    const permConnect = Array.isArray(dto.permissionIds) && dto.permissionIds.length > 0
      ? { connect: dto.permissionIds.map((id) => ({ id })) }
      : undefined;

    const newRole = await prisma.role.create({
      data: {
        name: trimmedName,
        description: dto.description?.trim() || null,
        permissions: permConnect,
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
      dataToUpdate.permissions = {
        set: dto.permissionIds.map((pid) => ({ id: pid })),
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
