import { Router } from "express";
import { gameService } from "./game.service.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { Authenticate } from "../../middleware/authenticate.middleware.js";
import { requirePermission } from "../../middleware/authorize.middleware.js";
import { PermissionName } from "../../generated/prisma/index.js";
import { validate } from "../../middleware/validate.middleware.js";
import { UpdateGameSettingsSchema } from "./game.schema.js";

const gameRouter = Router();

gameRouter.use(Authenticate);

// ========================
// CLIENT ROUTES
// ========================

gameRouter.get("/history", requirePermission(PermissionName.READ_GAME_HISTORY), asyncHandler(async (req, res) => {
  const data = await gameService.getHistory((req as any).user.id || (req as any).user.userId);
  res.status(200).json({ success: true, data });
}));

gameRouter.get("/:code/play", requirePermission(PermissionName.READ_GAME_LIST), asyncHandler(async (req, res) => {
  const code = req.params.code as string;
  const difficulty = (req.query.difficulty as string) || "EASY";
  const userCefrLevel = (req.query.cefrLevel as string) || "A1";
  
  const data = await gameService.play(code, difficulty, userCefrLevel);
  res.status(200).json({ success: true, data });
}));

// ========================
// ADMIN ROUTES
// ========================
gameRouter.get("/admin", requirePermission(PermissionName.READ_GAME_SETTING_LIST), asyncHandler(async (req, res) => {
  const games = await gameService.getAllGames();
  res.status(200).json({ success: true, data: games });
}));

gameRouter.put("/admin/:id/settings", requirePermission(PermissionName.UPDATE_GAME_SETTING), validate(UpdateGameSettingsSchema), asyncHandler(async (req, res) => {
  const settings = await gameService.updateSettings(parseInt(req.params.id as string), req.body);
  res.status(200).json({ success: true, message: "Cập nhật cấu hình game thành công", data: settings });
}));

export { gameRouter };
