import { Router } from "express";
import { Authenticate } from "../../middleware/authenticate.middleware.js";
import { requirePermission } from "../../middleware/authorize.middleware.js";
import { PermissionName } from "../../generated/prisma/index.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { staffService } from "./staff.service.js";

export const staffRouter = Router();

// Yêu cầu xác thực đăng nhập cho toàn bộ API quản lý nhân viên
staffRouter.use(Authenticate);

/**
 * GET /api/admin/staff - Lấy danh sách nhân viên có phân trang, tìm kiếm, lọc theo vai trò
 */
staffRouter.get(
  "/",
  requirePermission(PermissionName.READ_ROLE_LIST),
  asyncHandler(async (req: any, res) => {
    const currentUserId = Number(req.user?.userId);
    const result = await staffService.getStaffList(req.query, currentUserId);
    res.status(200).json({
      success: true,
      message: "Lấy danh sách nhân viên thành công",
      data: result,
    });
  })
);

/**
 * GET /api/admin/staff/candidates - Tìm kiếm học viên để nâng cấp thành nhân viên
 */
staffRouter.get(
  "/candidates",
  requirePermission(PermissionName.READ_ROLE_LIST),
  asyncHandler(async (req: any, res) => {
    const search = String(req.query.search || "");
    const candidates = await staffService.searchCandidateUsers(search);
    res.status(200).json({
      success: true,
      message: "Tìm kiếm học viên thành công",
      data: candidates,
    });
  })
);

/**
 * GET /api/admin/staff/me - Lấy thông tin tài khoản admin/nhân viên hiện tại kèm danh sách permissions
 */
staffRouter.get(
  "/me",
  asyncHandler(async (req: any, res) => {
    const currentUserId = Number(req.user?.userId);
    const data = await staffService.getCurrentStaff(currentUserId);
    res.status(200).json({
      success: true,
      message: "Lấy thông tin tài khoản hiện tại thành công",
      data,
    });
  })
);

/**
 * GET /api/admin/staff/:id - Chi tiết nhân viên cùng các quyền hạn
 */
staffRouter.get(
  "/:id",
  requirePermission(PermissionName.READ_ROLE_DETAIL),
  asyncHandler(async (req: any, res) => {
    const id = parseInt(String(req.params.id), 10);
    const currentUserId = Number(req.user?.userId);
    const staff = await staffService.getStaffById(id, currentUserId);
    res.status(200).json({
      success: true,
      message: "Lấy thông tin nhân viên thành công",
      data: staff,
    });
  })
);

/**
 * POST /api/admin/staff - Tạo tài khoản nhân viên mới (hoặc tài khoản Admin mới)
 */
staffRouter.post(
  "/",
  requirePermission(PermissionName.CREATE_ROLE),
  asyncHandler(async (req: any, res) => {
    const currentUserId = Number(req.user?.userId);
    const newStaff = await staffService.createStaff(req.body, currentUserId);
    res.status(201).json({
      success: true,
      message: "Tạo tài khoản nhân viên thành công",
      data: newStaff,
    });
  })
);

/**
 * PUT /api/admin/staff/:id - Cập nhật nhân viên / Đổi vai trò (gán quyền)
 * Lưu ý: Áp dụng luật bảo vệ Quản trị viên (Admin không thể đụng thông tin của Admin khác)
 */
staffRouter.put(
  "/:id",
  requirePermission(PermissionName.UPDATE_ROLE),
  asyncHandler(async (req: any, res) => {
    const id = parseInt(String(req.params.id), 10);
    const currentUserId = Number(req.user?.userId);
    const updated = await staffService.updateStaff(id, req.body, currentUserId);
    res.status(200).json({
      success: true,
      message: "Cập nhật tài khoản nhân viên thành công",
      data: updated,
    });
  })
);

/**
 * DELETE /api/admin/staff/:id - Xóa tài khoản nhân viên
 * Lưu ý: Không thể xóa tài khoản Quản trị viên khác và không thể tự xóa chính mình!
 */
staffRouter.delete(
  "/:id",
  requirePermission(PermissionName.DELETE_ROLE),
  asyncHandler(async (req: any, res) => {
    const id = parseInt(String(req.params.id), 10);
    const currentUserId = Number(req.user?.userId);
    const result = await staffService.deleteStaff(id, currentUserId);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  })
);

/**
 * POST /api/admin/staff/:id/promote-admin - Nâng cấp nhanh tài khoản lên Quản trị viên (Admin)
 */
staffRouter.post(
  "/:id/promote-admin",
  requirePermission(PermissionName.UPDATE_ROLE),
  asyncHandler(async (req: any, res) => {
    const id = parseInt(String(req.params.id), 10);
    const currentUserId = Number(req.user?.userId);
    const result = await staffService.promoteToAdmin(id, currentUserId);
    res.status(200).json({
      success: true,
      message: result.message,
      data: result.user,
    });
  })
);

/**
 * POST /api/admin/staff/promote-user - Nâng cấp tài khoản học viên thông thường lên Nhân viên / Admin
 */
staffRouter.post(
  "/promote-user",
  requirePermission(PermissionName.UPDATE_ROLE),
  asyncHandler(async (req: any, res) => {
    const { userId, roleId } = req.body;
    const currentUserId = Number(req.user?.userId);
    const updated = await staffService.promoteUserToStaff(Number(userId), Number(roleId), currentUserId);
    res.status(200).json({
      success: true,
      message: "Nâng cấp tài khoản lên nhân viên thành công",
      data: updated,
    });
  })
);
