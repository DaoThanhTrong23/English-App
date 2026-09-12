import { Router, Response, NextFunction } from "express";
import { Authenticate, AuthenticateRequest } from "../../middleware/authenticate.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { StartGameSchema, MatchPairSchema, FinishGameSchema } from "./bubble-game.schema.js";
import { BubbleGameService } from "./bubble-game.service.js";

const router = Router();
const gameService = new BubbleGameService();

// GET /game/start - Lấy danh sách từ vựng cho game
router.get(
  "/start",
  Authenticate,
  validate(StartGameSchema) as any,
  async (req: AuthenticateRequest, res: Response, next: NextFunction) => {
    try {
      const userId = Number(req.user?.userId);
      const result = await gameService.startGame(userId, req.query as any);
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  }
);

// POST /game/match - Lưu tiến trình tạm từ FE
router.post(
  "/match",
  Authenticate,
  validate(MatchPairSchema) as any,
  async (req: AuthenticateRequest, res: Response, next: NextFunction) => {
    try {
      const userId = Number(req.user?.userId);
      const result = await gameService.matchPair(userId, req.body);
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  }
);

// POST /game/finish - Chốt điểm kết thúc ván chơi từ FE
router.post(
  "/finish",
  Authenticate,
  validate(FinishGameSchema) as any,
  async (req: AuthenticateRequest, res: Response, next: NextFunction) => {
    try {
      const userId = Number(req.user?.userId);
      const result = await gameService.finishGame(userId, req.body);
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  }
);

export default router;