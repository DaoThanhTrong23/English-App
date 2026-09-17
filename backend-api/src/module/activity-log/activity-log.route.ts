import { Router } from "express";
import { Authenticate } from "../../middleware/authenticate.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { Role } from "../../generated/prisma/index.js";
import { activityLogService } from "./activity-log.service.js";

const router = Router();

router.use(Authenticate, authorize([Role.admin]));

router.get(
  "/activities",
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const search = req.query.search ? String(req.query.search) : undefined;
    const actionType = req.query.actionType ? String(req.query.actionType) : undefined;
    const result = await activityLogService.getActivities(page, limit, search, actionType);
    res.status(200).json({
      success: true,
      message: "Lấy lịch sử hoạt động thành công",
      data: result,
    });
  })
);

router.get(
  "/login-logs",
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const search = req.query.search ? String(req.query.search) : undefined;
    const result = await activityLogService.getLoginLogs(page, limit, search);
    res.status(200).json({
      success: true,
      message: "Lấy lịch sử đăng nhập thành công",
      data: result,
    });
  })
);

export const activityLogRouter = router;
