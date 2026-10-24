import { Router } from "express";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { validate } from "../../middleware/validate.middleware.js";
import { Authenticate } from "../../middleware/authenticate.middleware.js";
import { requirePermission } from "../../middleware/authorize.middleware.js";
import { PermissionName } from "../../generated/prisma/index.js";
import { testService } from "./test.service.js";
import { CreateQuestionSchema, CreateTestSchema, UpdateQuestionSchema, UpdateTestSchema } from "./test.schema.js";
import multer from "multer";
import path from "path";
import { ApiError } from "../../shared/http/api-error.js";

export const testRouter = Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
});
const upload = multer({ storage: storage });

testRouter.use(Authenticate);

testRouter.post("/upload-media", requirePermission(PermissionName.CREATE_TEST_MEDIA), upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "no_file", "Chưa chọn file");
  res.status(200).json({ success: true, message: "Upload thành công", data: { url: `/uploads/${req.file.filename}` } });
}));

testRouter.post("/:testId/questions/import", requirePermission(PermissionName.CREATE_TEST_QUESTION_IMPORT), upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "no_file", "Chưa chọn file Excel");
  const result = await testService.importExcel(parseInt(req.params.testId as string), req.file.path);
  res.status(200).json({ success: true, message: "Import câu hỏi thành công", data: result });
}));

testRouter.get("/", requirePermission(PermissionName.READ_TEST_LIST), asyncHandler(async (req, res) => {
  const ceftLevel = req.query.ceftLevel as string;
  const search = req.query.search as string;
  let lessonId: number | null | undefined = undefined;
  if (req.query.lessonId === 'null') {
    lessonId = null;
  } else if (req.query.lessonId) {
    lessonId = parseInt(req.query.lessonId as string);
  }
  const result = await testService.getAllTests(ceftLevel, search, lessonId);
  res.status(200).json({ success: true, message: "Lấy danh sách bài thi thành công", data: result });
}));

testRouter.post("/", requirePermission(PermissionName.CREATE_TEST), validate(CreateTestSchema), asyncHandler(async (req, res) => {
  const result = await testService.createTest(req.body);
  res.status(201).json({ success: true, message: "Tạo bài thi thành công", data: result });
}));

testRouter.put("/:testId", requirePermission(PermissionName.UPDATE_TEST), validate(UpdateTestSchema), asyncHandler(async (req, res) => {
  const result = await testService.updateTest(parseInt(req.params.testId as string), req.body);
  res.status(200).json({ success: true, message: "Cập nhật bài thi thành công", data: result });
}));

testRouter.delete("/:testId", requirePermission(PermissionName.DELETE_TEST), asyncHandler(async (req, res) => {
  await testService.deleteTest(parseInt(req.params.testId as string));
  res.status(200).json({ success: true, message: "Xoá bài thi thành công" });
}));

testRouter.get("/:testId/questions", requirePermission(PermissionName.READ_TEST_QUESTIONS), asyncHandler(async (req, res) => {
  const result = await testService.getQuestions(parseInt(req.params.testId as string));
  res.status(200).json({ success: true, message: "Lấy danh sách câu hỏi thành công", data: result });
}));

testRouter.post("/:testId/questions", requirePermission(PermissionName.CREATE_TEST_QUESTION), validate(CreateQuestionSchema), asyncHandler(async (req, res) => {
  const result = await testService.addQuestion(parseInt(req.params.testId as string), req.body);
  res.status(201).json({ success: true, message: "Thêm câu hỏi thành công", data: result });
}));

testRouter.put("/:testId/questions/:questionId", requirePermission(PermissionName.UPDATE_TEST_QUESTION), validate(UpdateQuestionSchema), asyncHandler(async (req, res) => {
  const result = await testService.updateQuestion(parseInt(req.params.testId as string), parseInt(req.params.questionId as string), req.body);
  res.status(200).json({ success: true, message: "Cập nhật câu hỏi thành công", data: result });
}));

testRouter.delete("/:testId/questions/:questionId", requirePermission(PermissionName.DELETE_TEST_QUESTION), asyncHandler(async (req, res) => {
  await testService.deleteQuestion(parseInt(req.params.questionId as string));
  res.status(200).json({ success: true, message: "Xoá câu hỏi thành công" });
}));

testRouter.get("/:testId/results", requirePermission(PermissionName.READ_TEST_RESULTS), asyncHandler(async (req, res) => {
  const result = await testService.getTestResults(parseInt(req.params.testId as string));
  res.status(200).json({ success: true, message: "Lấy kết quả thi thành công", data: result });
}));
