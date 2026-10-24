import { NextFunction, Response } from "express";
import { AuthenticateRequest } from "./authenticate.middleware.js";
import { ApiError } from "../shared/http/api-error.js";
import { PermissionName } from "../generated/prisma/index.js";
import { permissionService } from "../module/permission/permission.service.js";

// Helper tương thích ngược với code cũ sử dụng Role.admin / Role.user
export const Role = {
  admin: "admin",
  user: "user",
} as const;
export type Role = typeof Role[keyof typeof Role];

/**
 * Middleware yêu cầu permission cụ thể:
 * Kiểm tra role của user có sở hữu permission này hay không.
 */
export const requirePermission = (permission: PermissionName | PermissionName[]) => {
  return async (req: AuthenticateRequest, res: Response, _next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ApiError(401, "unauthorized", "Thông tin người dùng chưa được xác thực");
      }

      const roleName = String(req.user.role || "user").toLowerCase();

      // Quản trị viên (Admin) luôn có toàn quyền trên toàn bộ các endpoint của hệ thống
      if (roleName === "admin") {
        return _next();
      }

      const requiredPerms = Array.isArray(permission) ? permission : [permission];

      // Kiểm tra xem role của user có ít nhất một trong các permission được yêu cầu không
      let hasAccess = false;
      for (const perm of requiredPerms) {
        const ok = await permissionService.hasPermission(roleName, perm);
        if (ok) {
          hasAccess = true;
          break;
        }
      }

      if (!hasAccess) {
        throw new ApiError(
          403,
          "forbidden",
          `Bạn không có quyền thực hiện hành động này [${requiredPerms.join(", ")}]`
        );
      }

      return _next();
    } catch (error) {
      return _next(error);
    }
  };
};

/**
 * Middleware authorize đa năng:
 * Hỗ trợ cả truyền Role array (code cũ) hoặc PermissionName (code mới)
 */
export const authorize = (allowed: string[] | PermissionName | PermissionName[]) => {
  if (Array.isArray(allowed) && allowed.length > 0 && typeof allowed[0] === "string" && (allowed[0] === "admin" || allowed[0] === "user")) {
    // Trường hợp kiểm tra theo Role (tương thích ngược)
    return (req: AuthenticateRequest, res: Response, _next: NextFunction) => {
      if (!req.user) {
        throw new ApiError(401, "unauthorized", "Thông tin người dùng chưa được xác thực");
      }

      const userRole = String(req.user.role || "").toLowerCase();
      if (!allowed.map((r) => r.toLowerCase()).includes(userRole)) {
        throw new ApiError(403, "forbidden", "Bạn không có quyền thực hiện hành động này");
      }
      return _next();
    };
  }

  // Trường hợp truyền PermissionName
  return requirePermission(allowed as PermissionName | PermissionName[]);
};