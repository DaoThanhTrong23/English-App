import { Router } from "express";
import { gameService } from "./game.service.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { Authenticate } from "../../middleware/authenticate.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { Role } from "../../generated/prisma/index.js";
import { validate } from "../../middleware/validate.middleware.js";
import { UpdateGameSettingsSchema } from "./game.schema.js";

const gameRouter = Router();

// ========================
// CLIENT ROUTES
// ========================
gameRouter.get("/:code/play", Authenticate, asyncHandler(async (req, res) => {
  const code = req.params.code as string;
  const difficulty = (req.query.difficulty as string) || "EASY";
  const userCefrLevel = (req.query.cefrLevel as string) || "A1"; // In real scenario, fallback or read from req.user
  
  const data = await gameService.play(code, difficulty, userCefrLevel);
  res.status(200).json({ success: true, data });
}));

// ========================
// ADMIN ROUTES
// ========================
gameRouter.use("/admin", Authenticate, authorize([Role.admin]));

gameRouter.get("/admin", asyncHandler(async (req, res) => {
  const games = await gameService.getAllGames();
  res.status(200).json({ success: true, data: games });
}));

gameRouter.put("/admin/:id/settings", validate(UpdateGameSettingsSchema), asyncHandler(async (req, res) => {
  const settings = await gameService.updateSettings(parseInt(req.params.id as string), req.body);
  res.status(200).json({ success: true, message: "Cập nhật cấu hình game thành công", data: settings });
}));

export { gameRouter };
