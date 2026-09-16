import { Router } from "express";
import { authorize } from "../../middleware/authorize.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { Role } from "../../generated/prisma/index.js";
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

// Tất cả các route quản lý khóa học đều yêu cầu đăng nhập (requireAuth) và quyền Admin
router.use(authorize,authorize([Role.admin]));

router.get(  "/totalLesson", asyncHandler(async (_req, res) => {
    const result = await courseService.getCourseCount();
    res.status(200).json({
      success: true,
      message: "Lấy tổng số bài học / khóa học thành công",
      data: result,
    });
  })
);

router.get( "/totalCourse", asyncHandler(async (_req, res) => {
    const result = await courseService.getCourseCount();
    res.status(200).json({
      success: true,
      message: "Lấy tổng số khóa học thành công",
      data: result,
    });
  })
);


router.get( "/",validate(GetCoursesQuerySchema),  asyncHandler(async (req, res) => {
    const result = await courseService.getCoursesList(req.query as any);
    res.status(200).json({
      success: true,
      message: "Lấy danh sách khóa học thành công",
      data: result,
    });
  })
);


router.post(  "/", validate(CreateCourseSchema), asyncHandler(async (req, res) => {
    const adminId = (req as any).user?.id;
    const result = await courseService.createCourse(req.body as any, adminId);
    res.status(201).json({
      success: true,
      message: "Tạo khóa học thành công",
      data: result,
    });
  })
);


router.get( "/:id", validate(CourseIdParamSchema),asyncHandler(async (req, res) => {
    const courseId = Number(req.params.id);
    const result = await courseService.getCourseDetail(courseId);
    res.status(200).json({
      success: true,
      message: "Lấy chi tiết khóa học thành công",
      data: result,
    });
  })
);

router.put(  "/:id", validate(UpdateCourseSchema), asyncHandler(async (req, res) => {
    const courseId = Number(req.params.id);
    const adminId = (req as any).user?.id;
    const result = await courseService.updateCourse(courseId, req.body as any, adminId);
    res.status(200).json({
      success: true,
      message: "Cập nhật khóa học thành công",
      data: result,
    });
  })
);


router.delete( "/:id",validate(CourseIdParamSchema), asyncHandler(async (req, res) => {
    const courseId = Number(req.params.id);
    const adminId = (req as any).user?.id;
    const result = await courseService.softDeleteCourse(courseId, adminId);
    res.status(200).json(result);
  })
);


router.patch( "/:id/restore", validate(CourseIdParamSchema), asyncHandler(async (req, res) => {
    const courseId = Number(req.params.id);
    const adminId = (req as any).user?.id;
    const result = await courseService.restoreCourse(courseId, adminId);
    res.status(200).json(result);
  })
);


router.post( "/:id/words", validate(AddWordsToCourseSchema),asyncHandler(async (req, res) => {
    const courseId = Number(req.params.id);
    const adminId = (req as any).user?.id;
    const { wordIds } = req.body as any;
    const result = await courseService.addWordsToCourse(courseId, wordIds, adminId);
    res.status(200).json({
      success: true,
      message: "Thêm từ vựng vào khóa học thành công",
      data: result,
    });
  })
);


router.delete(  "/:id/words/:wordId", validate(CourseWordParamSchema), asyncHandler(async (req, res) => {
    const courseId = Number(req.params.id);
    const wordId = Number(req.params.wordId);
    const adminId = (req as any).user?.id;
    const result = await courseService.removeWordFromCourse(courseId, wordId, adminId);
    res.status(200).json(result);
  })
);

export const courseRouter = router;
export default router;
