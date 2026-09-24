import { Router } from "express";
import { Authenticate } from "../../middleware/authenticate.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { validate } from "../../middleware/validate.middleware.js";
import { Role } from "../../generated/prisma/index.js";
import {
  CreateAchievementSchema,
  UpdateAchievementSchema,
  AchievementIdParamSchema,
} from "./achievement.schema.js";
import { achievementService } from "./achievement.service.js";

const router = Router();

router.use(Authenticate, authorize([Role.admin]));

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const result = await achievementService.getList();
    res.status(200).json({
      success: true,
      message: "Lấy danh sách danh hiệu thành công",
      data: result,
    });
  })
);

router.post(
  "/",
  validate(CreateAchievementSchema),
  asyncHandler(async (req, res) => {
    const adminId = (req as any).user?.id;
    const result = await achievementService.create(req.body as any, adminId);
    res.status(201).json({
      success: true,
      message: "Tạo danh hiệu thành công",
      data: result,
    });
  })
);

router.put(
  "/:id",
  validate(UpdateAchievementSchema),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const adminId = (req as any).user?.id;
    const result = await achievementService.update(id, req.body as any, adminId);
    res.status(200).json({
      success: true,
      message: "Cập nhật danh hiệu thành công",
      data: result,
    });
  })
);

router.delete(
  "/:id",
  validate(AchievementIdParamSchema),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const adminId = (req as any).user?.id;
    const result = await achievementService.delete(id, adminId);
    res.status(200).json(result);
  })
);

export default router;
