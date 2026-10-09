import { Router } from "express";
import { Authenticate } from "../../middleware/authenticate.middleware.js";
import { prisma } from "../../config/prisma.js";
import { asyncHandler } from "../../shared/http/async-handler.js";

export const notificationRouter = Router();

notificationRouter.use(Authenticate);

notificationRouter.get("/", asyncHandler(async (req: any, res) => {
  const userId = req.user?.userId;
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20
  });
  res.status(200).json({ success: true, data: notifications });
}));

notificationRouter.put("/:id/read", asyncHandler(async (req: any, res) => {
  const userId = req.user?.userId;
  const notifId = Number(req.params.id);
  await prisma.notification.updateMany({
    where: { id: notifId, userId },
    data: { isRead: true }
  });
  res.status(200).json({ success: true, message: "Đã đọc thông báo" });
}));
