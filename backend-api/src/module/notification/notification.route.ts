import { Router } from "express";
import { Authenticate } from "../../middleware/authenticate.middleware.js";
import { prisma } from "../../config/prisma.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { notificationService } from "./notification.service.js";

export const notificationRouter = Router();

notificationRouter.use(Authenticate);

// Lấy danh sách thông báo và số lượng chưa đọc (hỗ trợ cả user và admin)
notificationRouter.get("/", asyncHandler(async (req: any, res) => {
  const userId = req.user?.userId;
  const result = await notificationService.getNotifications(userId);
  res.status(200).json({
    success: true,
    data: result.notifications,
    unreadCount: result.unreadCount
  });
}));

// Đánh dấu tất cả là đã đọc
notificationRouter.put("/read-all", asyncHandler(async (req: any, res) => {
  const userId = req.user?.userId;
  await notificationService.markAllAsRead(userId);
  res.status(200).json({ success: true, message: "Đã đánh dấu tất cả thông báo là đã đọc" });
}));

// Đánh dấu 1 thông báo cụ thể là đã đọc
notificationRouter.put("/:id/read", asyncHandler(async (req: any, res) => {
  const userId = req.user?.userId;
  const notifId = Number(req.params.id);
  await notificationService.markAsRead(notifId, userId);
  res.status(200).json({ success: true, message: "Đã đọc thông báo" });
}));

// Xóa tất cả thông báo
notificationRouter.delete("/clear-all", asyncHandler(async (req: any, res) => {
  const userId = req.user?.userId;
  await notificationService.clearAll(userId);
  res.status(200).json({ success: true, message: "Đã xóa toàn bộ thông báo" });
}));

// Xóa 1 thông báo cụ thể
notificationRouter.delete("/:id", asyncHandler(async (req: any, res) => {
  const userId = req.user?.userId;
  const notifId = Number(req.params.id);
  await notificationService.deleteNotification(notifId, userId);
  res.status(200).json({ success: true, message: "Đã xóa thông báo" });
}));

/**
 * Lấy khung giờ học quen thuộc (ưa thích nhất) của người dùng dựa trên LoginLog (dành cho Mobile)
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
