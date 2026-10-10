const fs = require('fs');

let code = `import cron from 'node-cron';
import { prisma } from '../config/prisma.js';
import { studentLessonRepository } from '../module/student-lesson/student-lesson.repository.js';
import { loggers } from '../utils/logger.js';

export const startCronJobs = () => {
  // Chạy mỗi giờ (tại phút 0)
  cron.schedule("0 * * * *", async () => {
    try {
      loggers.info("[CRON] Bắt đầu quét nhắc nhở học tập (Dựa trên thói quen login)...");
      
      const users = await prisma.user.findMany({
        where: { role: 'user' },
        select: { id: true, username: true }
      });

      const now = new Date();
      const currentHour = now.getHours();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      let sentCount = 0;

      for (const user of users) {
        // 1. Kiểm tra hôm nay user đã đăng nhập chưa?
        const loginToday = await prisma.loginLog.findFirst({
          where: {
            userId: user.id,
            loginTime: { gte: startOfToday }
          }
        });

        if (loginToday) continue; // Đã học rồi thì thôi

        // 2. Kiểm tra hôm nay đã gửi thông báo chưa (để không spam mỗi giờ)
        const alreadySent = await prisma.notification.findFirst({
          where: {
            userId: user.id,
            createdAt: { gte: startOfToday },
            title: {
              in: ['Cảnh báo mất chuỗi! 😱', 'Đã đến giờ học tiếng Anh! 📚']
            }
          }
        });

        if (alreadySent) continue; // Nay nhắc rồi thì thôi

        // 3. Phân tích log đăng nhập để tìm GIỜ HỌC YÊU THÍCH (Habit)
        const logs = await prisma.loginLog.findMany({
          where: { userId: user.id },
          select: { loginTime: true },
        });

        let targetHour = 20; // Mặc định là 8h tối nếu chưa có data

        if (logs.length > 0) {
          const hourCounts = {};
          for (const log of logs) {
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

        // 4. Nếu chưa tới giờ quen thuộc của user -> chưa nhắc
        if (currentHour < targetHour) continue;

        // 5. Gửi thông báo
        const streak = await studentLessonRepository.calculateUserStreak(user.id);
        
        if (streak > 0) {
          await prisma.notification.create({
            data: {
              userId: user.id,
              title: 'Cảnh báo mất chuỗi! 😱',
              body: "Bạn đang có chuỗi " + streak + " ngày học liên tiếp. Đã đến giờ học quen thuộc (" + targetHour + "h), đừng để mất streak nhé!"
            }
          });
          sentCount++;
        } else {
          await prisma.notification.create({
            data: {
              userId: user.id,
              title: 'Đã đến giờ học tiếng Anh! 📚',
              body: "Dành ra 15 phút mỗi ngày để cải thiện tiếng Anh nhé " + user.username + "! Hệ thống thấy bạn thường học lúc " + targetHour + "h đó!"
            }
          });
          sentCount++;
        }
      }

      loggers.info("[CRON] Hoàn tất quét. Đã gửi " + sentCount + " thông báo nhắc nhở cá nhân hóa.");
    } catch (error) {
      loggers.error(error, "[CRON] Lỗi khi chạy job nhắc nhở: " + (error.message || "Unknown"));
    }
  });
};`;

fs.writeFileSync('backend-api/src/cron/reminder.cron.ts', code);
