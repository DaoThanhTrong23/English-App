import { prisma } from '../config/prisma.js';
import { studentLessonRepository } from '../module/student-lesson/student-lesson.repository.js';
import { loggers } from '../utils/logger.js';

export const startCronJobs = () => {
  const INTERVAL = 12 * 60 * 60 * 1000; 

  setInterval(async () => {
    try {
      loggers.info("[CRON] Bắt đầu quét nhắc nhở học tập...");
      
      const users = await prisma.user.findMany({
        where: { role: 'user' },
        select: { id: true, username: true }
      });

      let sentCount = 0;

      for (const user of users) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const loginToday = await prisma.loginLog.findFirst({
          where: {
            userId: user.id,
            loginTime: { gte: today }
          }
        });

        if (!loginToday) {
          const streak = await studentLessonRepository.calculateUserStreak(user.id);
          
          if (streak > 0) {
            await prisma.notification.create({
              data: {
                userId: user.id,
                title: 'Cảnh báo mất chuỗi! 🔥',
                body: "Bạn đang có chuỗi " + streak + " ngày học liên tiếp. Đừng để mất nhé, hãy vào học ngay!"
              }
            });
            sentCount++;
          } else {
            await prisma.notification.create({
              data: {
                userId: user.id,
                title: 'Đã đến giờ học tiếng Anh! 📚',
                body: "Dành ra 15 phút mỗi ngày để cải thiện tiếng Anh cùng Gà Con nhé " + user.username + "!"
              }
            });
            sentCount++;
          }
        }
      }

      loggers.info("[CRON] Hoàn tất quét. Đã gửi " + sentCount + " thông báo nhắc nhở.");
    } catch (error) {
      loggers.error(error, "[CRON] Lỗi khi chạy job nhắc nhở");
    }
  }, INTERVAL);
};
