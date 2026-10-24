import { Router } from "express";
import { Authenticate } from "../../middleware/authenticate.middleware.js";
import { requirePermission } from "../../middleware/authorize.middleware.js";
import { PermissionName } from "../../generated/prisma/index.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { roleService } from "./role.service.js";

export const roleRouter = Router();

// Toàn bộ API Quản lý vai trò (Role Management) yêu cầu xác thực đăng nhập
roleRouter.use(Authenticate);

/**
 * GET /api/admin/roles - Lấy danh sách toàn bộ vai trò
 */
roleRouter.get(
  "/",
  requirePermission(PermissionName.READ_ROLE_LIST),
  asyncHandler(async (req, res) => {
    const roles = await roleService.getAllRoles();
    res.status(200).json({
      success: true,
      message: "Lấy danh sách vai trò thành công",
      data: roles,
    });
  })
);

/**
 * GET /api/admin/roles/permissions - Lấy toàn bộ quyền hạn trong hệ thống (nhóm theo module)
 */
roleRouter.get(
  "/permissions",
  requirePermission(PermissionName.READ_ROLE_LIST),
  asyncHandler(async (req, res) => {
    const permissionsData = await roleService.getAllPermissionsGrouped();
    res.status(200).json({
      success: true,
      message: "Lấy danh sách quyền hạn thành công",
      data: permissionsData,
    });
  })
);

/**
 * GET /api/admin/roles/:id - Xem chi tiết một vai trò
 */
roleRouter.get(
  "/:id",
  requirePermission(PermissionName.READ_ROLE_DETAIL),
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const role = await roleService.getRoleById(id);
    res.status(200).json({
      success: true,
      message: "Lấy chi tiết vai trò thành công",
      data: role,
    });
  })
);

/**
 * POST /api/admin/roles - Tạo vai trò mới (Custom Role)
 */
roleRouter.post(
  "/",
  requirePermission(PermissionName.CREATE_ROLE),
  asyncHandler(async (req, res) => {
    const { name, description, permissionIds } = req.body;
    const newRole = await roleService.createRole({
      name,
      description,
      permissionIds: Array.isArray(permissionIds) ? permissionIds.map(Number) : undefined,
    });

    res.status(201).json({
      success: true,
      message: "Tạo vai trò mới thành công",
      data: newRole,
    });
  })
);

/**
 * PUT /api/admin/roles/:id - Cập nhật vai trò (Chỉ custom role, chặn admin/user)
 */
roleRouter.put(
  "/:id",
  requirePermission(PermissionName.UPDATE_ROLE),
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { name, description, permissionIds } = req.body;

    const updatedRole = await roleService.updateRole(id, {
      name,
      description,
      permissionIds: Array.isArray(permissionIds) ? permissionIds.map(Number) : undefined,
    });

    res.status(200).json({
      success: true,
      message: "Cập nhật vai trò thành công",
      data: updatedRole,
    });
  })
);

/**
 * DELETE /api/admin/roles/:id - Xóa vai trò (Chỉ custom role, chặn admin/user)
 */
roleRouter.delete(
  "/:id",
  requirePermission(PermissionName.DELETE_ROLE),
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const result = await roleService.deleteRole(id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  })
);

export default roleRouter;
