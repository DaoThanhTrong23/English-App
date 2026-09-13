import { Router, Request, Response } from "express";
import { Authenticate } from "../../middleware/authenticate.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import {
  StartWordMatchingSchema,
  SubmitWordMatchingSchema,
  SaveWordMatchingProgressSchema,
} from "./word-matching.schema.js";
import { wordMatchingService } from "./word-matching.service.js";

const router = Router();

// GET /game/word-matching/start - Khởi tạo ván chơi nối từ (10 từ chia làm 2 cột A và B lộn xộn)
router.get(
  "/start",
  Authenticate,
  validate(StartWordMatchingSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = Number(req.user?.userId);
    const result = await wordMatchingService.startGame(userId, req.query as any);
    res.status(200).json({
      success: true,
      message: "Khởi tạo ván chơi nối từ vựng thành công",
      data: result,
    });
  })
);

// POST /game/word-matching/submit - Xác nhận nộp toàn bộ kết quả nối từ, chấm điểm và trả về chi tiết
router.post(
  "/submit",
  Authenticate,
  validate(SubmitWordMatchingSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = Number(req.user?.userId);
    const result = await wordMatchingService.submitAnswers(userId, req.body);
    res.status(200).json({
      success: true,
      message: "Xác nhận kết quả nối từ thành công",
      data: result,
    });
  })
);

// POST /game/word-matching/progress - Lưu tiến trình nối tạm thời nếu cần
router.post(
  "/progress",
  Authenticate,
  validate(SaveWordMatchingProgressSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = Number(req.user?.userId);
    const result = await wordMatchingService.saveProgress(userId, req.body);
    res.status(200).json({
      success: true,
      message: "Lưu tiến trình tạm thời thành công",
      data: result,
    });
  })
);

export default router;
