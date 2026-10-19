import { Router } from "express";
import { Authenticate } from "../../middleware/authenticate.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { Role } from "../../generated/prisma/index.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { topicSettingService } from "./topic-setting.service.js";

export const topicSettingRouter = Router();

topicSettingRouter.use(Authenticate, authorize([Role.admin]));

/**
 * GET /api/admin/topic-settings - Lấy cấu hình số lượng topic theo cấp độ
 */
topicSettingRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const data = topicSettingService.getSettings();
    res.status(200).json({
      success: true,
      message: "Lấy cấu hình số lượng chủ đề thành công",
      data,
    });
  })
);

/**
 * PUT /api/admin/topic-settings - Cập nhật cấu hình số lượng topic theo cấp độ
 */
topicSettingRouter.put(
  "/",
  asyncHandler(async (req, res) => {
    const { defaultLimit, groups, levels } = req.body;
    const updated = topicSettingService.updateSettings({
      defaultLimit,
      groups: groups || levels,
    });
    res.status(200).json({
      success: true,
      message: "Cập nhật cấu hình số lượng chủ đề thành công",
      data: updated,
    });
  })
);
