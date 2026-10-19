import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AchievementService } from '../../achievement.service.js';
import { achievementEvaluator } from '../../achievement.evaluator.js';
import { mockAchievement, mockCreateAchievementInput } from '../data-mock/achievement.mock.js';
import { ApiError } from '../../../../shared/http/api-error.js';
import { prisma } from '../../../../config/prisma.js';
import { studentLessonRepository } from '../../../student-lesson/student-lesson.repository.js';

vi.mock('../../../../config/prisma.js', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    achievement: { findMany: vi.fn(), findUnique: vi.fn() },
    userAchievement: { createMany: vi.fn() },
    notification: { createMany: vi.fn() },
  },
}));

vi.mock('../../../student-lesson/student-lesson.repository.js', () => ({
  studentLessonRepository: {
    calculateUserStreak: vi.fn(),
  },
}));

describe('Achievement Module - Unit Tests (QC 10-Year Standard)', () => {
  let service: AchievementService;
  let mockRepo: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepo = {
      findAll: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    service = new AchievementService(mockRepo);
  });

  describe('1. Happy Cases', () => {
    it('[ACH-01a] Admin lấy danh sách danh hiệu thành công', async () => {
      mockRepo.findAll.mockResolvedValue([mockAchievement]);

      const res = await service.getList();

      expect(res.length).toBe(1);
      expect(res[0].title).toBe(mockAchievement.title);
    });

    it('[ACH-01b] Đánh giá mở khóa danh hiệu tự động khi đủ XP và Streak', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 1,
        xpPoints: 150,
        userAchievements: [],
      } as any);
      vi.mocked(prisma.achievement.findMany).mockResolvedValue([mockAchievement] as any);
      vi.mocked(studentLessonRepository.calculateUserStreak).mockResolvedValue(7);

      await achievementEvaluator.evaluateUserAchievements(1);

      expect(prisma.userAchievement.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ userId: 1, achievementId: 1 }),
        ]),
      });
      expect(prisma.notification.createMany).toHaveBeenCalled();
    });
  });

  describe('2. Bad End Cases', () => {
    it('[ACH-02a] Cập nhật danh hiệu không tồn tại ném lỗi 404', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.update(999, { title: 'Mới' })).rejects.toThrowError(
        expect.objectContaining({ statuscode: 404 })
      );
    });

    it('[ACH-02b] Không mở khóa danh hiệu nếu chưa đủ Streak dù đã đủ XP', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 1,
        xpPoints: 500, // Đủ XP
        userAchievements: [],
      } as any);
      vi.mocked(prisma.achievement.findMany).mockResolvedValue([mockAchievement] as any);
      vi.mocked(studentLessonRepository.calculateUserStreak).mockResolvedValue(3); // Chưa đủ 7 ngày

      await achievementEvaluator.evaluateUserAchievements(1);

      expect(prisma.userAchievement.createMany).not.toHaveBeenCalled();
    });
  });

  describe('3. Concurrency Cases', () => {
    it('[ACH-03] Không mở khóa trùng lặp danh hiệu học viên đã sở hữu', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 1,
        xpPoints: 150,
        userAchievements: [{ userId: 1, achievementId: 1, unlockedAt: new Date() }], // Đã có rồi
      } as any);
      vi.mocked(prisma.achievement.findMany).mockResolvedValue([mockAchievement] as any);
      vi.mocked(studentLessonRepository.calculateUserStreak).mockResolvedValue(10);

      await achievementEvaluator.evaluateUserAchievements(1);

      expect(prisma.userAchievement.createMany).not.toHaveBeenCalled();
    });
  });

  describe('4. Data Conflict & Network Failures', () => {
    it('[ACH-05] Mất kết nối DB khi đánh giá danh hiệu không làm chết ứng dụng', async () => {
      vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error('DB Timeout (P1008)'));

      await expect(achievementEvaluator.evaluateUserAchievements(1)).rejects.toThrow('DB Timeout');
    });
  });
});
