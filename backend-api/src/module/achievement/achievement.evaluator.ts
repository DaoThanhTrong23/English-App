import { prisma } from '../../config/prisma.js';
import { studentLessonRepository } from '../student-lesson/student-lesson.repository.js';

export class AchievementEvaluator {
  /**
   * Đánh giá và tự động cấp danh hiệu cho người dùng
   */
  async evaluateUserAchievements(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { userAchievements: true }
    });
    if (!user) return;

    // Get all achievements
    const allAchievements = await prisma.achievement.findMany();
    
    // Get user stats
    const xp = user.xpPoints;
    const streak = await studentLessonRepository.calculateUserStreak(userId);

    const newlyUnlocked: any[] = [];

    for (const ach of allAchievements) {
      // Bỏ qua nếu đã có
      if (user.userAchievements.some(ua => ua.achievementId === ach.id)) continue;

      let isEligible = true;
      if (ach.requireXp > 0 && xp < ach.requireXp) isEligible = false;
      if (ach.requireStreak > 0 && streak < ach.requireStreak) isEligible = false;

      if (isEligible) {
        newlyUnlocked.push({
          userId,
          achievementId: ach.id,
          unlockedAt: new Date()
        });
      }
    }

    if (newlyUnlocked.length > 0) {
      await prisma.userAchievement.createMany({ data: newlyUnlocked });
      
      // Tạo notification cho mỗi achievement mới
      const notifs = newlyUnlocked.map(ua => {
        const achDef = allAchievements.find(a => a.id === ua.achievementId);
        return {
          userId,
          title: 'Thành tựu mới!',
          body: `Chúc mừng bạn đã mở khóa huy hiệu: ${achDef?.title}`
        };
      });
      await prisma.notification.createMany({ data: notifs });
    }
  }
}

export const achievementEvaluator = new AchievementEvaluator();
