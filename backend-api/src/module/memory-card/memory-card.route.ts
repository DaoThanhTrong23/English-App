import { Router, Response } from "express";
import { Authenticate, AuthenticateRequest } from "../../middleware/authenticate.middleware.js";
import { requirePermission } from "../../middleware/authorize.middleware.js";
import { PermissionName } from "../../generated/prisma/index.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import {
  StartMemoryGameSchema,
  SaveProgressSchema,
  FinishMemoryGameSchema,
} from "./memory-card.schema.js";
import { memoryCardService } from "./memory-card.service.js";

const router = Router();

// GET /game/memory-card/start - Lấy 12 thẻ bài đã trộn ngẫu nhiên từ 6 từ vựng
router.get(
  "/start",
  Authenticate,
  requirePermission(PermissionName.READ_MEMORY_CARD_GAME),
  validate(StartMemoryGameSchema),
  asyncHandler(async (req: AuthenticateRequest, res: Response) => {
    const userId = Number(req.user?.userId);
    const result = await memoryCardService.startGame(userId, req.query as any);
    res.status(200).json({
      success: true,
      message: "Khởi tạo ván Memory Card thành công",
      data: result,
    });
  })
);

// POST /game/memory-card/progress - Lưu tiến trình tạm (điểm, số cặp đã mở, số lượt lật)
router.post(
  "/progress",
  Authenticate,
  requirePermission(PermissionName.UPDATE_MEMORY_CARD_PROGRESS),
  validate(SaveProgressSchema),
  asyncHandler(async (req: AuthenticateRequest, res: Response) => {
    const userId = Number(req.user?.userId);
    const result = await memoryCardService.saveProgress(userId, req.body);
    res.status(200).json({
      success: true,
      message: "Lưu tiến trình thành công",
      data: result,
    });
  })
);

// POST /game/memory-card/finish - Chốt kết quả, cộng điểm XP và kết thúc ván
router.post(
  "/finish",
  Authenticate,
  requirePermission(PermissionName.CREATE_MEMORY_CARD_RESULT),
  validate(FinishMemoryGameSchema),
  asyncHandler(async (req: AuthenticateRequest, res: Response) => {
    const userId = Number(req.user?.userId);
    const result = await memoryCardService.finishGame(userId, req.body);
    res.status(200).json({
      success: true,
      message: "Kết thúc ván Memory Card thành công",
      data: result,
    });
  })
);

export default router;
