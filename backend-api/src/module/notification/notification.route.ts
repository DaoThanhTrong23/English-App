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

/**
 * Lấy khung giờ học quen thuộc (ưa thích nhất) của người dùng dựa trên LoginLog
 */

notificationRouter.get("/preferred-time", asyncHandler(async (req: any, res) => {
  const userId = req.user?.userId;

  const logs = await prisma.loginLog.findMany({
    where: { userId },
    select: { loginTime: true },
    orderBy: { loginTime: 'desc' },
  });

  let preferredHour = 20;
  const hourCounts: Record<number, number> = {};

  if (logs.length > 0) {
    for (const log of logs) {
      const h = log.loginTime.getHours();
      hourCounts[h] = (hourCounts[h] || 0) + 1;
    }

    let maxCount = 0;
    for (const [hourStr, count] of Object.entries(hourCounts)) {
      const numCount = count as number;
      if (numCount > maxCount) {
        maxCount = numCount;
        preferredHour = parseInt(hourStr, 10);
      }
    }
  }

  res.status(200).json({
    success: true,
    data: {
      preferredHour,
      preferredMinute: 0,
      totalLogins: logs.length,
      hourDistribution: hourCounts,
      formattedTime: `${preferredHour.toString().padStart(2, '0')}:00`,
    },
  });
}));

