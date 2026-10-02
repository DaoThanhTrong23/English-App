import { Router } from "express";
import { Authenticate } from "../../middleware/authenticate.middleware.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { onboardingService } from "./onboarding.service.js";
import { ApiError } from "../../shared/http/api-error.js";

const router = Router();

// GET: Lấy đề test đầu vào (Placement Test)
router.get(
  "/placement-test",
  Authenticate,
  asyncHandler(async (req: any, res) => {
    const questions = await onboardingService.getPlacementQuestions();
    res.status(200).json({ success: true, data: questions });
  })
);

// POST: Submit thông tin user + Kết quả bài test
router.post(
  "/submit",
  Authenticate,
  asyncHandler(async (req: any, res) => {
    const userId = req.user.userId;
    const { job, interests, answers } = req.body;

    if (!answers || !Array.isArray(answers)) {
      throw new ApiError(400, "invalid_answers", "Vui lòng cung cấp answers");
    }

    const result = await onboardingService.processOnboarding(userId, job, interests, answers);
    res.status(200).json({
      success: true,
      message: "Hoàn tất onboarding",
      data: result,
    });
  })
);


// POST: Check progress for early stopping
router.post(
  "/check-progress",
  Authenticate,
  asyncHandler(async (req: any, res) => {
    const { answers } = req.body;
    if (!answers || !Array.isArray(answers)) {
      throw new ApiError(400, "invalid_answers", "Vui long cung cap answers");
    }
    const result = await onboardingService.checkProgress(answers);
    res.status(200).json({ success: true, data: result });
  })
);

export const onboardingRouter = router;

