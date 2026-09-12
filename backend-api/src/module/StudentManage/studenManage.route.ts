// src/module/StudentManage/studenMange.route.ts
import { Router } from "express";
import { Authenticate } from "../../middleware/authenticate.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { GetStudentQuerySchema, StudentIdParamSchema } from "./studentManage.schema.js";
import { studentManageService } from "./studentManage.service.js";


const router = Router();

// Tất cả các route bên dưới chỉ dành cho ADMIN đã đăng nhập
router.use(Authenticate, authorize(["admin"]));

/**
 *  GET /api/admin/students
 *  Lấy danh sách học viên có phân trang, tìm kiếm, tiến độ học & lần cuối hoạt động
 */
router.get(
  "/",
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

/**
 * @route   GET /api/admin/students/:id
 * @desc    Xem chi tiết tiến trình học, bài thi và nhật ký của 1 học viên
 */
router.get(
  "/:id",
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

export const studentManageRouter = router;
export default router;