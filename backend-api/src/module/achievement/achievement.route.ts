import { Router } from "express";
import { Authenticate } from "../../middleware/authenticate.middleware.js";
import { requirePermission } from "../../middleware/authorize.middleware.js";
import { PermissionName } from "../../generated/prisma/index.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { validate } from "../../middleware/validate.middleware.js";
import {
  CreateAchievementSchema,
  UpdateAchievementSchema,
  AchievementIdParamSchema,
} from "./achievement.schema.js";
import { achievementService } from "./achievement.service.js";

const router = Router();

router.use(Authenticate);

router.get(
  "/",
  requirePermission(PermissionName.READ_ACHIEVEMENT_LIST),
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
  requirePermission(PermissionName.CREATE_ACHIEVEMENT),
  validate(CreateAchievementSchema),
  asyncHandler(async (req, res) => {
    const adminId = (req as any).user?.id || (req as any).user?.userId;
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
  requirePermission(PermissionName.UPDATE_ACHIEVEMENT),
  validate(UpdateAchievementSchema),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const adminId = (req as any).user?.id || (req as any).user?.userId;
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
  requirePermission(PermissionName.DELETE_ACHIEVEMENT),
  validate(AchievementIdParamSchema),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const adminId = (req as any).user?.id || (req as any).user?.userId;
    const result = await achievementService.delete(id, adminId);
    res.status(200).json(result);
  })
);

export default router;
