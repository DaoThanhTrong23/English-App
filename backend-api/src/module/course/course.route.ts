import { Router } from "express";
import { requirePermission } from "../../middleware/authorize.middleware.js";
import { Authenticate } from "../../middleware/authenticate.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { PermissionName } from "../../generated/prisma/index.js";
import {
  AddWordsToCourseSchema,
  CourseIdParamSchema,
  CourseWordParamSchema,
  CreateCourseSchema,
  GetCoursesQuerySchema,
  UpdateCourseSchema,
} from "./course.schema.js";
import { courseService } from "./course.service.js";

const router = Router();

// Xác thực người dùng
router.use(Authenticate);

router.get(
  "/totalLesson",
  requirePermission(PermissionName.READ_COURSE_COUNT),
  asyncHandler(async (_req, res) => {
    const result = await courseService.getCourseCount();
    res.status(200).json({
      success: true,
      message: "Lấy tổng số bài học / khóa học thành công",
      data: result,
    });
  })
);

router.get(
  "/totalCourse",
  requirePermission(PermissionName.READ_COURSE_COUNT),
  asyncHandler(async (_req, res) => {
    const result = await courseService.getCourseCount();
    res.status(200).json({
      success: true,
      message: "Lấy tổng số khóa học thành công",
      data: result,
    });
  })
);

router.get(
  "/",
  requirePermission(PermissionName.READ_COURSE_LIST),
  validate(GetCoursesQuerySchema),
  asyncHandler(async (req, res) => {
    const result = await courseService.getCoursesList(req.query as any);
    res.status(200).json({
      success: true,
      message: "Lấy danh sách khóa học thành công",
      data: result,
    });
  })
);

router.post(
  "/",
  requirePermission(PermissionName.CREATE_COURSE),
  validate(CreateCourseSchema),
  asyncHandler(async (req, res) => {
    const adminId = (req as any).user?.id || (req as any).user?.userId;
    const result = await courseService.createCourse(req.body as any, adminId);
    res.status(201).json({
      success: true,
      message: "Tạo khóa học thành công",
      data: result,
    });
  })
);

router.get(
  "/:id",
  requirePermission(PermissionName.READ_COURSE_DETAIL),
  validate(CourseIdParamSchema),
  asyncHandler(async (req, res) => {
    const courseId = Number(req.params.id);
    const result = await courseService.getCourseDetail(courseId);
    res.status(200).json({
      success: true,
      message: "Lấy chi tiết khóa học thành công",
      data: result,
    });
  })
);

router.put(
  "/:id",
  requirePermission(PermissionName.UPDATE_COURSE),
  validate(UpdateCourseSchema),
  asyncHandler(async (req, res) => {
    const courseId = Number(req.params.id);
    const adminId = (req as any).user?.id || (req as any).user?.userId;
    const result = await courseService.updateCourse(courseId, req.body as any, adminId);
    res.status(200).json({
      success: true,
      message: "Cập nhật khóa học thành công",
      data: result,
    });
  })
);

router.delete(
  "/:id",
  requirePermission(PermissionName.DELETE_COURSE),
  validate(CourseIdParamSchema),
  asyncHandler(async (req, res) => {
    const courseId = Number(req.params.id);
    const adminId = (req as any).user?.id || (req as any).user?.userId;
    const result = await courseService.softDeleteCourse(courseId, adminId);
    res.status(200).json(result);
  })
);

router.patch(
  "/:id/restore",
  requirePermission(PermissionName.UPDATE_COURSE_RESTORE),
  validate(CourseIdParamSchema),
  asyncHandler(async (req, res) => {
    const courseId = Number(req.params.id);
    const adminId = (req as any).user?.id || (req as any).user?.userId;
    const result = await courseService.restoreCourse(courseId, adminId);
    res.status(200).json(result);
  })
);

router.post(
  "/:id/words",
  requirePermission(PermissionName.CREATE_COURSE_WORDS),
  validate(AddWordsToCourseSchema),
  asyncHandler(async (req, res) => {
    const courseId = Number(req.params.id);
    const adminId = (req as any).user?.id || (req as any).user?.userId;
    const { wordIds } = req.body as any;
    const result = await courseService.addWordsToCourse(courseId, wordIds, adminId);
    res.status(200).json({
      success: true,
      message: "Thêm từ vựng vào khóa học thành công",
      data: result,
    });
  })
);

router.delete(
  "/:id/words/:wordId",
  requirePermission(PermissionName.DELETE_COURSE_WORDS),
  validate(CourseWordParamSchema),
  asyncHandler(async (req, res) => {
    const courseId = Number(req.params.id);
    const wordId = Number(req.params.wordId);
    const adminId = (req as any).user?.id || (req as any).user?.userId;
    const result = await courseService.removeWordFromCourse(courseId, wordId, adminId);
    res.status(200).json(result);
  })
);

export const courseRouter = router;
export default router;
