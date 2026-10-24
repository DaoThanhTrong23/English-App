import { Router } from "express";
import { Authenticate } from "../../middleware/authenticate.middleware.js";
import { requirePermission } from "../../middleware/authorize.middleware.js";
import { PermissionName } from "../../generated/prisma/index.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { studentTestService } from "./student-test.service.js";

export const studentTestRouter = Router();

studentTestRouter.use(Authenticate);

studentTestRouter.get(
  "/:id",
  requirePermission(PermissionName.READ_STUDENT_TEST_DETAIL),
  asyncHandler(async (req: any, res) => {
    const userId = Number(req.user?.userId);
    const testId = Number(req.params.id);
    const result = await studentTestService.getTestDetail(testId, userId);
    res.status(200).json({
      success: true,
      message: "Lấy chi tiết bài kiểm tra thành công",
      data: result,
    });
  })
);

studentTestRouter.post(
  "/:id/submit",
  requirePermission(PermissionName.CREATE_STUDENT_TEST_SUBMISSION),
  asyncHandler(async (req: any, res) => {
    const userId = Number(req.user?.userId);
    const testId = Number(req.params.id);
    const { submissions } = req.body;
    
    if (!submissions || !Array.isArray(submissions)) {
      return res.status(400).json({ success: false, message: "Dữ liệu nộp bài không hợp lệ" });
    }

    const result = await studentTestService.submitTest(userId, testId, submissions);
    res.status(200).json({
      success: true,
      message: "Nộp bài kiểm tra thành công",
      data: result,
    });
  })
);
