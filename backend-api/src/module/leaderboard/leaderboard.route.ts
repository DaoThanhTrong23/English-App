import { Router } from "express";
import { Authenticate } from "../../middleware/authenticate.middleware.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { leaderboardService } from "./leaderboard.service.js";

export const leaderboardRouter = Router();

leaderboardRouter.use(Authenticate);

leaderboardRouter.get(
  "/",
  asyncHandler(async (req: any, res) => {
    const userId = Number(req.user?.userId);
    const limit = Number(req.query.limit) || 20;
    const result = await leaderboardService.getLeaderboard(userId, limit);
    res.status(200).json({
      success: true,
      message: "Lấy bảng xếp hạng thành công",
      data: result,
    });
  })
);
