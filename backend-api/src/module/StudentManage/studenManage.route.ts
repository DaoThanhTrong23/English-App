// src/module/StudentManage/studenManage.route.ts
import { Router } from "express";
import { Authenticate } from "../../middleware/authenticate.middleware.js";
import { requirePermission } from "../../middleware/authorize.middleware.js";
import { PermissionName } from "../../generated/prisma/index.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { GetStudentQuerySchema, StudentIdParamSchema, UpdateStudentStatusSchema } from "./studentManage.schema.js";
import { studentManageService } from "./studentManage.service.js";

const router = Router();

router.use(Authenticate);

/**
 *  GET /api/admin/students
 *  Lấy danh sách học viên có phân trang, tìm kiếm, tiến độ học & lần cuối hoạt động
 */
router.get(
  "/",
  requirePermission(PermissionName.READ_STUDENT_LIST),
  validate(GetStudentQuerySchema),
  asyncHandler(async (req, res) => {
    const result = await studentManageService.getStudentslist(req.query as any);
    res.status(200).json({
      success: true,
      message: "Lấy danh sách học viên thành công",
      data: result,
    });
  })
);

router.get(
  "/totalStudent",
  requirePermission(PermissionName.READ_STUDENT_COUNT),
  asyncHandler(async (req, res) => {
    const result = await studentManageService.getStudentCount();
    res.status(200).json({ success: true, message: "Lấy số lượng học viên thành công", data: result });
  })
);

/**
 * @route   GET /api/admin/students/top
 * @desc    Lấy danh sách học viên xuất sắc
 */
router.get(
  "/top",
  requirePermission(PermissionName.READ_STUDENT_TOP),
  asyncHandler(async (req, res) => {
    const limit = Number(req.query.limit) || 5;
    const result = await studentManageService.getTopStudents(limit);
    res.status(200).json({
      success: true,
      message: "Lấy danh sách học viên xuất sắc thành công",
      data: result,
    });
  })
);

router.get(
  "/:id",
  requirePermission(PermissionName.READ_STUDENT_DETAIL),
  validate(StudentIdParamSchema),
  asyncHandler(async (req, res) => {
    const studentId = Number(req.params.id);
    const result = await studentManageService.getStudentDetail(studentId);
    res.status(200).json({
      success: true,
      message: "Lấy chi tiết học viên thành công",
      data: result,
    });
  })
);

router.get(
  "/:id/progress",
  requirePermission(PermissionName.READ_STUDENT_PROGRESS),
  validate(StudentIdParamSchema),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const result = await studentManageService.getUserProgress(id);
    res.status(200).json({
      success: true,
      message: "Lấy tiến độ học từ vựng thành công",
      data: result,
    });
  })
);

router.get(
  "/:id/ai-chat",
  requirePermission(PermissionName.READ_STUDENT_AI_CHAT),
  validate(StudentIdParamSchema),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const result = await studentManageService.getUserAiChat(id);
    res.status(200).json({
      success: true,
      message: "Lấy lịch sử chat AI thành công",
      data: result,
    });
  })
);

/**
 * @route   PATCH /api/admin/students/:id/status
 * @desc    Admin khóa hoặc mở khóa tài khoản học viên
 */
router.patch(
  "/:id/status",
  requirePermission(PermissionName.UPDATE_STUDENT_STATUS),
  validate(UpdateStudentStatusSchema),
  asyncHandler(async (req, res) => {
    const studentId = Number(req.params.id);
    const { isLocked } = req.body;

    const result = await studentManageService.updateStudentLockStatus(studentId, isLocked);

    res.status(200).json({
      success: true,
      message: isLocked ? "Đã khóa tài khoản học viên thành công" : "Đã mở khóa tài khoản học viên thành công",
      data: result,
    });
  })
);

export const studentManageRouter = router;
export default router;