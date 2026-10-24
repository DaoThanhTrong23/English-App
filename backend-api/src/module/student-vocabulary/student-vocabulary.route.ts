import { Router } from "express";
import { Authenticate, AuthenticateRequest } from "../../middleware/authenticate.middleware.js";
import { requirePermission } from "../../middleware/authorize.middleware.js";
import { PermissionName } from "../../generated/prisma/index.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import {
  AddStudentVocabularySchema,
  GetStudentVocabularyQuerySchema,
  StudentVocabularyIdParamSchema,
  UpdateStudentVocabularySchema,
} from "./student-vocabulary.schema.js";
import { studentVocabularyService } from "./student-vocabulary.service.js";

const router = Router();

// Toàn bộ API quản lý từ vựng cá nhân yêu cầu người dùng/học viên đăng nhập
router.use(Authenticate);

/**
 * GET / - Lấy danh sách từ vựng của học viên với phân trang Lazy Loading
 */
router.get(
  "/",
  requirePermission(PermissionName.READ_STUDENT_VOCABULARY_LIST),
  validate(GetStudentVocabularyQuerySchema),
  asyncHandler(async (req: AuthenticateRequest, res) => {
    const userId = Number(req.user?.userId);
    const result = await studentVocabularyService.getVocabularyList(userId, req.query as any);
    res.status(200).json({
      success: true,
      message: "Lấy danh sách từ vựng thành công",
      data: result,
    });
  })
);

/**
 * GET /reviews/due - Lấy danh sách từ vựng đến hạn ôn tập (Spaced Repetition)
 */
router.get(
  "/reviews/due",
  requirePermission(PermissionName.READ_STUDENT_VOCABULARY_REVIEW),
  asyncHandler(async (req: AuthenticateRequest, res) => {
    const userId = Number(req.user?.userId);
    const result = await studentVocabularyService.getDueReviews(userId);
    res.status(200).json({ success: true, data: result });
  })
);

/**
 * POST /reviews - Nộp kết quả ôn tập từ vựng
 */
router.post(
  "/reviews",
  requirePermission(PermissionName.CREATE_STUDENT_VOCABULARY_REVIEW),
  asyncHandler(async (req: AuthenticateRequest, res) => {
    const userId = Number(req.user?.userId);
    const { wordId, isCorrect } = req.body;
    if (!wordId || isCorrect === undefined) {
      return res.status(400).json({ success: false, message: "Thiếu wordId hoặc isCorrect" });
    }
    const result = await studentVocabularyService.submitReview(userId, Number(wordId), Boolean(isCorrect));
    res.status(200).json({ success: true, data: result });
  })
);

/**
 * POST / - Thêm từ vựng vào danh sách của học viên
 */
router.post(
  "/",
  requirePermission(PermissionName.CREATE_STUDENT_VOCABULARY),
  validate(AddStudentVocabularySchema),
  asyncHandler(async (req: AuthenticateRequest, res) => {
    const userId = Number(req.user?.userId);
    const result = await studentVocabularyService.addVocabulary(userId, req.body as any);
    res.status(201).json({
      success: true,
      message: "Thêm từ vựng vào danh sách thành công",
      data: result,
    });
  })
);

/**
 * POST /toggle - Lưu hoặc Bỏ lưu từ vựng theo wordId (Bookmark)
 */
router.post(
  "/toggle",
  requirePermission(PermissionName.CREATE_STUDENT_VOCABULARY),
  asyncHandler(async (req: AuthenticateRequest, res) => {
    const userId = Number(req.user?.userId);
    const wordId = Number(req.body.wordId);
    if (!wordId) {
      return res.status(400).json({ success: false, message: "Vui lòng cung cấp wordId" });
    }
    const result = await studentVocabularyService.toggleVocabulary(userId, wordId);
    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  })
);

/**
 * GET /:id - Xem chi tiết một từ vựng trong danh sách của học viên
 */
router.get(
  "/:id",
  requirePermission(PermissionName.READ_STUDENT_VOCABULARY_LIST),
  validate(StudentVocabularyIdParamSchema),
  asyncHandler(async (req: AuthenticateRequest, res) => {
    const userId = Number(req.user?.userId);
    const id = Number(req.params.id);
    const result = await studentVocabularyService.getVocabularyDetail(userId, id);
    res.status(200).json({
      success: true,
      message: "Lấy chi tiết từ vựng thành công",
      data: result,
    });
  })
);

/**
 * PUT /:id - Cập nhật trạng thái / thông tin từ vựng của học viên
 */
router.put(
  "/:id",
  requirePermission(PermissionName.UPDATE_STUDENT_VOCABULARY_STATUS),
  validate(UpdateStudentVocabularySchema),
  asyncHandler(async (req: AuthenticateRequest, res) => {
    const userId = Number(req.user?.userId);
    const id = Number(req.params.id);
    const result = await studentVocabularyService.updateVocabulary(userId, id, req.body as any);
    res.status(200).json({
      success: true,
      message: "Cập nhật từ vựng thành công",
      data: result,
    });
  })
);

/**
 * DELETE /:id - Xóa từ vựng khỏi danh sách của học viên
 */
router.delete(
  "/:id",
  requirePermission(PermissionName.DELETE_STUDENT_VOCABULARY),
  validate(StudentVocabularyIdParamSchema),
  asyncHandler(async (req: AuthenticateRequest, res) => {
    const userId = Number(req.user?.userId);
    const id = Number(req.params.id);
    const result = await studentVocabularyService.deleteVocabulary(userId, id);
    res.status(200).json({
      success: true,
      message: "Xóa từ vựng khỏi danh sách học thành công",
      data: result,
    });
  })
);

export const studentVocabularyRouter = router;
export default router;
