import { Router } from "express";
import { Authenticate, AuthenticateRequest } from "../../middleware/authenticate.middleware.js";
import { requirePermission } from "../../middleware/authorize.middleware.js";
import { PermissionName } from "../../generated/prisma/index.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import {
  GetStudentCoursesQuerySchema,
  StudentCourseIdParamSchema,
  StudentLessonIdParamSchema,
} from "./student-lesson.schema.js";
import { studentLessonService } from "./student-lesson.service.js";

// ==========================================
// 1. ROUTER KHÓA HỌC DÀNH CHO HỌC VIÊN
// ==========================================
export const studentCourseRouter = Router();

// Yêu cầu học viên đăng nhập
studentCourseRouter.use(Authenticate);

/**
 * GET /api/student/courses - Lấy danh sách khóa học / chủ đề kèm tiến độ
 */
studentCourseRouter.get(
  "/",
  requirePermission(PermissionName.READ_STUDENT_COURSE_LIST),
  validate(GetStudentCoursesQuerySchema),
  asyncHandler(async (req: AuthenticateRequest, res) => {
    const userId = Number(req.user?.userId);
    const result = await studentLessonService.getCoursesList(userId, req.query as any);
    res.status(200).json({
      success: true,
      message: "Lấy danh sách khóa học thành công",
      data: result,
    });
  })
);

/**
 * GET /api/student/courses/levels-progress - Tiến độ tổng hợp từng cấp độ CEFR và chứng chỉ
 */
studentCourseRouter.get(
  "/levels-progress",
  requirePermission(PermissionName.READ_STUDENT_COURSE_LIST),
  asyncHandler(async (req: AuthenticateRequest, res) => {
    const userId = Number(req.user?.userId);
    const result = await studentLessonService.getLevelsProgress(userId);
    res.status(200).json({
      success: true,
      message: "Lấy tiến độ các cấp độ thành công",
      data: result,
    });
  })
);

/**
 * POST /api/student/courses/set-active-level - Đổi cấp độ học tập chính
 */
studentCourseRouter.post(
  "/set-active-level",
  requirePermission(PermissionName.UPDATE_STUDENT_LESSON_PROGRESS),
  asyncHandler(async (req: AuthenticateRequest, res) => {
    const userId = Number(req.user?.userId);
    const { level } = req.body;
    const result = await studentLessonService.setActiveLevel(userId, level);
    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  })
);

/**
 * GET /api/student/courses/:courseId - Xem chi tiết khóa học kèm danh sách bài học
 */
studentCourseRouter.get(
  "/:courseId",
  requirePermission(PermissionName.READ_STUDENT_COURSE_DETAIL),
  validate(StudentCourseIdParamSchema),
  asyncHandler(async (req: AuthenticateRequest, res) => {
    const userId = Number(req.user?.userId);
    const courseId = Number(req.params.courseId);
    const result = await studentLessonService.getCourseDetail(userId, courseId);
    res.status(200).json({
      success: true,
      message: "Lấy chi tiết khóa học thành công",
      data: result,
    });
  })
);

/**
 * POST /api/student/courses/:courseId/enroll - Đăng ký / thêm chủ đề vào phần học chính
 */
studentCourseRouter.post(
  "/:courseId/enroll",
  requirePermission(PermissionName.UPDATE_STUDENT_LESSON_PROGRESS),
  validate(StudentCourseIdParamSchema),
  asyncHandler(async (req: AuthenticateRequest, res) => {
    const userId = Number(req.user?.userId);
    const courseId = Number(req.params.courseId);
    const result = await studentLessonService.enrollCourse(userId, courseId);
    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  })
);

/**
 * GET /api/student/courses/:courseId/lessons - Lấy danh sách bài học thuộc khóa học
 */
studentCourseRouter.get(
  "/:courseId/lessons",
  requirePermission(PermissionName.READ_STUDENT_COURSE_LESSONS),
  validate(StudentCourseIdParamSchema),
  asyncHandler(async (req: AuthenticateRequest, res) => {
    const userId = Number(req.user?.userId);
    const courseId = Number(req.params.courseId);
    const result = await studentLessonService.getLessonsByCourse(userId, courseId);
    res.status(200).json({
      success: true,
      message: "Lấy danh sách bài học của khóa học thành công",
      data: result,
    });
  })
);

// ==========================================
// 2. ROUTER BÀI HỌC DÀNH CHO HỌC VIÊN
// ==========================================
export const studentLessonRouter = Router();

// Yêu cầu học viên đăng nhập
studentLessonRouter.use(Authenticate);

/**
 * GET /api/student/lessons/:id - Xem chi tiết bài học (Lý thuyết, Video, Từ vựng + Tiến độ, Bài test)
 */
studentLessonRouter.get(
  "/:id",
  requirePermission(PermissionName.READ_STUDENT_LESSON_DETAIL),
  validate(StudentLessonIdParamSchema),
  asyncHandler(async (req: AuthenticateRequest, res) => {
    const userId = Number(req.user?.userId);
    const lessonId = Number(req.params.id);
    const result = await studentLessonService.getLessonDetail(userId, lessonId);
    res.status(200).json({
      success: true,
      message: "Lấy chi tiết bài học thành công",
      data: result,
    });
  })
);

/**
 * POST /api/student/lessons/:id/complete - Đánh dấu hoàn thành bài học và nhận thưởng XP
 */
studentLessonRouter.post(
  "/:id/complete",
  requirePermission(PermissionName.UPDATE_STUDENT_LESSON_PROGRESS),
  validate(StudentLessonIdParamSchema),
  asyncHandler(async (req: AuthenticateRequest, res) => {
    const userId = Number(req.user?.userId);
    const lessonId = Number(req.params.id);
    const result = await studentLessonService.completeLesson(userId, lessonId);
    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  })
);

export default {
  studentCourseRouter,
  studentLessonRouter,
};
