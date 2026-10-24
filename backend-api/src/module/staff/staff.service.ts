import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../shared/http/api-error.js";
import { bcryptHash } from "../../utils/hash.js";
import { PermissionName } from "../../generated/prisma/index.js";

export interface GetStaffQuery {
  page?: number | string;
  limit?: number | string;
  search?: string;
  roleId?: number | string;
  isLocked?: boolean | string;
}

export interface CreateStaffDto {
  username: string;
  email: string;
  password: string;
  roleId: number;
  job?: string;
}

export interface UpdateStaffDto {
  username?: string;
  email?: string;
  password?: string;
  roleId?: number;
  job?: string;
  isLocked?: boolean;
}

export class StaffService {
  /**
   * Lấy thông tin tài khoản hiện tại kèm role và danh sách permissions
   */
  async getCurrentStaff(currentUserId: number) {
    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!user) {
      throw new ApiError(404, "not_found", "Không tìm thấy người dùng");
    }

    const roleName = user.role?.name || "user";
    const isAdmin = roleName.toLowerCase() === "admin";
    const permissions = isAdmin
      ? Object.values(PermissionName)
      : user.role?.permissions.map((p) => p.name) || [];

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: roleName,
      avatarUrl: user.avatarUrl,
      permissions,
      isCallerAdmin: isAdmin,
    };
  }

  /**
   * Kiểm tra xem người gọi API có phải là Quản trị viên (Admin) hay không
   */
  async isCallerAdmin(userId: number): Promise<boolean> {
    if (!userId) return false;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: { select: { name: true } } },
    });
    return user?.role?.name?.toLowerCase() === "admin";
  }

  /**
   * Lấy danh sách nhân viên (nhân viên là các user có role khác 'user')
   */
  async getStaffList(query: GetStaffQuery, currentUserId: number) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = {
      role: {
        name: { not: "user" },
      },
    };

    if (query.search && typeof query.search === "string" && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { username: { contains: term } },
        { email: { contains: term } },
        { job: { contains: term } },
      ];
    }

    if (query.roleId) {
      where.roleId = Number(query.roleId);
    }

    if (query.isLocked !== undefined && query.isLocked !== "") {
      where.isLocked = String(query.isLocked) === "true";
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ roleId: "asc" }, { createdAt: "desc" }],
        select: {
          id: true,
          username: true,
          email: true,
          job: true,
          avatarUrl: true,
          isLocked: true,
          roleId: true,
          role: {
            select: {
              id: true,
              name: true,
              description: true,
              _count: {
                select: { permissions: true },
              },
            },
          },
          lastLoginDate: true,
          createdAt: true,
        },
      }),
    ]);

    const staffList = users.map((u) => {
      const isAdmin = u.role.name.toLowerCase() === "admin";
      const isSelf = u.id === currentUserId;
      // Luật: Admin hiện tại không thể đụng thông tin admin khác
      // canModify: Admin hiện tại có thể sửa nếu không phải là admin khác
      const canModify = !isAdmin || isSelf;
      const canDelete = !isAdmin; // Không ai được xóa tài khoản Admin

      return {
        id: u.id,
        username: u.username,
        email: u.email,
        job: u.job,
        avatarUrl: u.avatarUrl,
        isLocked: u.isLocked,
        roleId: u.roleId,
        role: {
          id: u.role.id,
          name: u.role.name,
          description: u.role.description,
          permissionCount: u.role._count.permissions,
        },
        isAdmin,
        isSelf,
        canModify,
        canDelete,
        lastLoginDate: u.lastLoginDate,
        createdAt: u.createdAt,
      };
    });

    return {
      staff: staffList,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Lấy chi tiết nhân viên cùng các quyền hạn thừa hưởng từ vai trò
   */
  async getStaffById(id: number, currentUserId: number) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        job: true,
        avatarUrl: true,
        isLocked: true,
        roleId: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
            permissions: {
              select: {
                id: true,
                name: true,
                description: true,
                module: true,
              },
            },
          },
        },
        createdAt: true,
        lastLoginDate: true,
      },
    });

    if (!user || user.role.name.toLowerCase() === "user") {
      throw new ApiError(404, "not_found", "Không tìm thấy tài khoản nhân viên");
    }

    const isAdmin = user.role.name.toLowerCase() === "admin";
    const isSelf = user.id === currentUserId;

    return {
      ...user,
      isAdmin,
      isSelf,
      canModify: !isAdmin || isSelf,
      canDelete: !isAdmin,
    };
  }

  /**
   * Tạo mới tài khoản nhân viên (hoặc tài khoản admin mới)
   */
  async createStaff(dto: CreateStaffDto, _currentUserId: number) {
    const username = dto.username?.trim();
    const email = dto.email?.trim().toLowerCase();
    const roleId = Number(dto.roleId);

    if (!username || username.length < 3) {
      throw new ApiError(400, "bad_request", "Tên đăng nhập phải có ít nhất 3 ký tự");
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ApiError(400, "bad_request", "Địa chỉ email không đúng định dạng");
    }

    if (!dto.password || dto.password.length < 6) {
      throw new ApiError(400, "bad_request", "Mật khẩu phải có ít nhất 6 ký tự");
    }

    // Kiểm tra trùng username hoặc email
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
      select: { id: true, username: true, email: true },
    });

    if (existing) {
      if (existing.username.toLowerCase() === username.toLowerCase()) {
        throw new ApiError(400, "bad_request", "Tên đăng nhập này đã được sử dụng");
      }
      throw new ApiError(400, "bad_request", "Địa chỉ email này đã được sử dụng");
    }

    // Kiểm tra vai trò được gán: vai trò phải tồn tại và không được là role 'user'
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new ApiError(400, "bad_request", "Vai trò được chọn không tồn tại");
    }

    if (role.name.toLowerCase() === "user") {
      throw new ApiError(
        400,
        "bad_request",
        "Vai trò 'user' dành cho học viên, nhân viên phải được gán vai trò quản trị hoặc vai trò tùy chỉnh"
      );
    }

    // LUẬT: Chỉ có Quản trị viên (Admin) mới được tạo tài khoản Admin
    if (role.name.toLowerCase() === "admin") {
      const callerIsAdmin = await this.isCallerAdmin(_currentUserId);
      if (!callerIsAdmin) {
        throw new ApiError(
          403,
          "forbidden",
          "Chỉ có Quản trị viên (Admin) mới có quyền tạo thêm tài khoản Quản trị viên!"
        );
      }
    }

    // Hash mật khẩu
    const passwordHash = await bcryptHash(dto.password);

    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        roleId: role.id,
        job: dto.job?.trim() || null,
        onboardingCompleted: true,
      },
      select: {
        id: true,
        username: true,
        email: true,
        job: true,
        roleId: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        createdAt: true,
      },
    });

    return newUser;
  }

  /**
   * Cập nhật thông tin nhân viên / Đổi vai trò (gán quyền)
   * LUẬT ĐẶC BIỆT: Admin không thể đụng thông tin của Admin khác!
   */
  async updateStaff(id: number, dto: UpdateStaffDto, currentUserId: number) {
    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!targetUser) {
      throw new ApiError(404, "not_found", "Không tìm thấy tài khoản nhân viên");
    }

    const isTargetAdmin = targetUser.role.name.toLowerCase() === "admin";
    const isSelf = targetUser.id === currentUserId;

    // === LUẬT: Admin không thể đụng thông tin Admin khác ===
    if (isTargetAdmin && !isSelf) {
      throw new ApiError(
        403,
        "forbidden",
        "Bạn không có quyền chỉnh sửa hoặc can thiệp thông tin của Quản trị viên khác!"
      );
    }

    const updateData: any = {};

    // Nếu sửa username
    if (dto.username && dto.username.trim()) {
      const username = dto.username.trim();
      if (username !== targetUser.username) {
        const exist = await prisma.user.findFirst({
          where: { username, id: { not: id } },
          select: { id: true },
        });
        if (exist) {
          throw new ApiError(400, "bad_request", "Tên đăng nhập này đã được sử dụng");
        }
        updateData.username = username;
      }
    }

    // Nếu sửa email
    if (dto.email && dto.email.trim()) {
      const email = dto.email.trim().toLowerCase();
      if (email !== targetUser.email) {
        const exist = await prisma.user.findFirst({
          where: { email, id: { not: id } },
          select: { id: true },
        });
        if (exist) {
          throw new ApiError(400, "bad_request", "Địa chỉ email này đã được sử dụng");
        }
        updateData.email = email;
      }
    }

    // Nếu đổi vai trò (Gán quyền)
    if (dto.roleId !== undefined && dto.roleId !== targetUser.roleId) {
      const newRoleId = Number(dto.roleId);

      // Nếu đang thao tác trên chính tài khoản của mình và hiện tại đang là Admin -> không thể tự hạ cấp mình
      if (isSelf && isTargetAdmin && newRoleId !== targetUser.roleId) {
        throw new ApiError(
          400,
          "bad_request",
          "Bạn không thể tự hạ cấp vai trò Quản trị viên của chính mình!"
        );
      }

      const role = await prisma.role.findUnique({ where: { id: newRoleId } });
      if (!role) {
        throw new ApiError(400, "bad_request", "Vai trò mới không tồn tại");
      }
      if (role.name.toLowerCase() === "user") {
        throw new ApiError(
          400,
          "bad_request",
          "Không thể gán vai trò 'user' cho nhân viên. Hãy gán vai trò Quản trị viên hoặc vai trò chuyên trách khác"
        );
      }

      // LUẬT: Chỉ có Quản trị viên (Admin) mới được nâng cấp tài khoản lên Admin
      if (role.name.toLowerCase() === "admin") {
        const callerIsAdmin = await this.isCallerAdmin(currentUserId);
        if (!callerIsAdmin) {
          throw new ApiError(
            403,
            "forbidden",
            "Chỉ có Quản trị viên (Admin) mới có quyền nâng cấp tài khoản lên Quản trị viên!"
          );
        }
      }

      updateData.roleId = newRoleId;
    }

    // Nếu đổi mật khẩu
    if (dto.password && dto.password.trim()) {
      if (dto.password.length < 6) {
        throw new ApiError(400, "bad_request", "Mật khẩu mới phải có ít nhất 6 ký tự");
      }
      updateData.passwordHash = await bcryptHash(dto.password);
    }

    // Nếu cập nhật nghề nghiệp / mô tả
    if (dto.job !== undefined) {
      updateData.job = dto.job ? dto.job.trim() : null;
    }

    // Nếu thay đổi trạng thái khóa tài khoản
    if (dto.isLocked !== undefined) {
      if (isSelf && dto.isLocked) {
        throw new ApiError(400, "bad_request", "Bạn không thể tự khóa tài khoản của chính mình!");
      }
      updateData.isLocked = Boolean(dto.isLocked);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        job: true,
        avatarUrl: true,
        isLocked: true,
        roleId: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        createdAt: true,
        lastLoginDate: true,
      },
    });

    return updated;
  }

  /**
   * Xóa tài khoản nhân viên
   * LUẬT: Không thể xóa tài khoản Quản trị viên khác và không thể tự xóa chính mình!
   */
  async deleteStaff(id: number, currentUserId: number) {
    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!targetUser) {
      throw new ApiError(404, "not_found", "Không tìm thấy tài khoản nhân viên");
    }

    if (targetUser.id === currentUserId) {
      throw new ApiError(400, "bad_request", "Bạn không thể tự xóa tài khoản của chính mình!");
    }

    if (targetUser.role.name.toLowerCase() === "admin") {
      throw new ApiError(
        403,
        "forbidden",
        "Không được phép xóa tài khoản của Quản trị viên khác!"
      );
    }

    // Xóa các dữ liệu phụ thuộc liên quan đến user trước khi xóa
    await prisma.$transaction([
      prisma.refreshToken.deleteMany({ where: { userId: id } }),
      prisma.revoked_token.deleteMany({ where: { user_id: id } }),
      prisma.loginLog.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } }),
    ]);

    return { success: true, message: "Đã xóa tài khoản nhân viên thành công" };
  }

  /**
   * Nâng cấp nhanh một tài khoản lên Quản trị viên (Admin)
   */
  async promoteToAdmin(id: number, currentUserId: number) {
    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!targetUser) {
      throw new ApiError(404, "not_found", "Không tìm thấy tài khoản");
    }

    // LUẬT: Chỉ có Quản trị viên (Admin) mới có quyền nâng cấp tài khoản lên Admin
    const callerIsAdmin = await this.isCallerAdmin(currentUserId);
    if (!callerIsAdmin) {
      throw new ApiError(
        403,
        "forbidden",
        "Chỉ có Quản trị viên (Admin) mới có quyền nâng cấp tài khoản lên Quản trị viên!"
      );
    }

    if (targetUser.role.name.toLowerCase() === "admin") {
      return {
        alreadyAdmin: true,
        message: "Tài khoản này hiện tại đã là Quản trị viên",
        user: targetUser,
      };
    }

    // Lấy role Admin (thường là role id = 1 hoặc name = 'admin')
    const adminRole = await prisma.role.findFirst({
      where: { name: "admin" },
    });

    if (!adminRole) {
      throw new ApiError(500, "server_error", "Không tìm thấy vai trò Quản trị viên trong hệ thống");
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { roleId: adminRole.id },
      select: {
        id: true,
        username: true,
        email: true,
        roleId: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    return {
      alreadyAdmin: false,
      message: `Đã nâng cấp tài khoản '${updated.username}' lên Quản trị viên thành công`,
      user: updated,
    };
  }

  /**
   * Tìm kiếm học viên/người dùng thông thường (role = 'user') để nâng cấp thành nhân viên
   */
  async searchCandidateUsers(searchTerm: string) {
    const term = searchTerm?.trim();
    if (!term || term.length < 2) return [];

    const users = await prisma.user.findMany({
      where: {
        role: { name: "user" },
        OR: [
          { username: { contains: term } },
          { email: { contains: term } },
        ],
      },
      take: 10,
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        job: true,
        createdAt: true,
      },
    });

    return users;
  }

  /**
   * Nâng cấp một học viên thông thường lên Nhân viên / Admin bằng cách gán vai trò
   */
  async promoteUserToStaff(userId: number, roleId: number, currentUserId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new ApiError(404, "not_found", "Không tìm thấy người dùng");
    }

    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role || role.name.toLowerCase() === "user") {
      throw new ApiError(
        400,
        "bad_request",
        "Vai trò được chọn không hợp lệ cho nhân viên"
      );
    }

    // LUẬT: Chỉ có Quản trị viên (Admin) mới có quyền nâng cấp học viên lên Admin
    if (role.name.toLowerCase() === "admin") {
      const callerIsAdmin = await this.isCallerAdmin(currentUserId);
      if (!callerIsAdmin) {
        throw new ApiError(
          403,
          "forbidden",
          "Chỉ có Quản trị viên (Admin) mới có quyền nâng cấp tài khoản lên Quản trị viên!"
        );
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { roleId: role.id },
      select: {
        id: true,
        username: true,
        email: true,
        job: true,
        roleId: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    return updated;
  }
}

export const staffService = new StaffService();
