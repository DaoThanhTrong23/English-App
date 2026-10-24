import cron from 'node-cron';
import { prisma } from '../config/prisma.js';
import { studentLessonRepository } from '../module/student-lesson/student-lesson.repository.js';
import { loggers } from '../utils/logger.js';

export const startCronJobs = () => {
  // Chạy mỗi giờ (tại phút 0)
  cron.schedule("0 * * * *", async () => {
    try {
      loggers.info("[CRON] Bắt đầu quét nhắc nhở học tập (Batch optimized)...");
      
      const now = new Date();
      const currentHour = now.getHours();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // 1. Lấy tất cả user học viên
      const users = await prisma.user.findMany({
        where: { role: { name: 'user' }, isLocked: false },
        select: { id: true, username: true }
      });

      if (users.length === 0) return;

      // 2. BATCH QUERY 1: Tìm danh sách các user đã đăng nhập hoặc đã học hôm nay
      const [todayLogins, todayTestResults] = await Promise.all([
        prisma.loginLog.findMany({
          where: { loginTime: { gte: startOfToday } },
          select: { userId: true }
        }),
        prisma.userTestResult.findMany({
          where: { completedAt: { gte: startOfToday } },
          select: { userId: true }
        })
      ]);

      const studiedTodaySet = new Set<number>([
        ...todayLogins.map(l => l.userId),
        ...todayTestResults.map(t => t.userId)
      ]);

      // 3. BATCH QUERY 2: Tìm danh sách các user đã được gửi thông báo hôm nay
      const todayReminded = await prisma.notification.findMany({
        where: {
          createdAt: { gte: startOfToday },
          title: {
            in: ['Cảnh báo mất chuỗi!', 'Đã đến giờ học tiếng Anh!', 'Đã đến giờ học tiếng Anh gòi bạn iuu']
          }
        },
        select: { userId: true }
      });

      const alreadyRemindedSet = new Set<number>(todayReminded.map(n => n.userId));

      // Lọc ra các ứng viên cần xem xét nhắc nhở
      const candidates = users.filter(
        u => !studiedTodaySet.has(u.id) && !alreadyRemindedSet.has(u.id)
      );

      if (candidates.length === 0) {
        loggers.info("[CRON] Không có học viên nào cần gửi nhắc nhở trong giờ này.");
        return;
      }

      let sentCount = 0;
      const notificationsToCreate: { userId: number; title: string; body: string }[] = [];

      for (const user of candidates) {
        // Phân tích thói quen giờ học (chỉ lấy 20 log gần nhất để tối ưu tốc độ)
        const recentLogs = await prisma.loginLog.findMany({
          where: { userId: user.id },
          orderBy: { loginTime: 'desc' },
          take: 20,
          select: { loginTime: true }
        });

        let targetHour = 20; // Mặc định 20h (8h tối)
        if (recentLogs.length > 0) {
          const hourCounts: Record<number, number> = {};
          for (const log of recentLogs) {
            const h = log.loginTime.getHours();
            hourCounts[h] = (hourCounts[h] || 0) + 1;
          }

          let maxCount = 0;
          for (const [hourStr, count] of Object.entries(hourCounts)) {
            if (count > maxCount) {
              maxCount = count;
              targetHour = parseInt(hourStr, 10);
            }
          }
        }

        // Nếu chưa tới giờ quen thuộc của học viên -> chưa nhắc
        if (currentHour < targetHour) continue;

        const streak = await studentLessonRepository.calculateUserStreak(user.id);
        
        if (streak > 0) {
          notificationsToCreate.push({
            userId: user.id,
            title: 'Cảnh báo mất chuỗi!',
            body: `Bạn đang có chuỗi ${streak} ngày học liên tiếp. Đã đến giờ học (${targetHour}h), đừng để mất streak nhé!`
          });
        } else {
          notificationsToCreate.push({
            userId: user.id,
            title: 'Đã đến giờ học tiếng Anh!',
            body: `Dành ra 15 phút mỗi ngày để cải thiện tiếng Anh nhé ${user.username}! Hệ thống thấy bạn thường học lúc ${targetHour}h đó!`
          });
        }
        sentCount++;
      }

      // Batch insert tất cả thông báo
      if (notificationsToCreate.length > 0) {
        await prisma.notification.createMany({
          data: notificationsToCreate
        });
      }

      loggers.info(`[CRON] Hoàn tất quét. Đã gửi ${sentCount} thông báo nhắc nhở thành công.`);
    } catch (error: any) {
      loggers.error(error, `[CRON] Lỗi khi chạy job nhắc nhở: ${error.message || "Unknown"}`);
    }
  });
};