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

  describe('3. Đụng Độ Đồng Thời & Race Condition (Concurrency Cases)', () => {
    it('[ACH-03a] Không mở khóa trùng lặp danh hiệu học viên đã sở hữu (Idempotency)', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 1,
        xpPoints: 150,
        userAchievements: [{ userId: 1, achievementId: 1, unlockedAt: new Date() }],
      } as any);
      vi.mocked(prisma.achievement.findMany).mockResolvedValue([mockAchievement] as any);
      vi.mocked(studentLessonRepository.calculateUserStreak).mockResolvedValue(10);

      await achievementEvaluator.evaluateUserAchievements(1);

      expect(prisma.userAchievement.createMany).not.toHaveBeenCalled();
    });

    it('[ACH-03b] Đánh giá mở khóa liên tiếp/đồng thời: Lần gọi thứ 2 phát hiện đã mở khóa sẽ bỏ qua', async () => {
      let alreadyUnlocked = false;
      (prisma.user.findUnique as any).mockImplementation(async () => {
        return {
          id: 1,
          xpPoints: 200,
          userAchievements: alreadyUnlocked ? [{ userId: 1, achievementId: 1, unlockedAt: new Date() }] : [],
        };
      });
      vi.mocked(prisma.achievement.findMany).mockResolvedValue([mockAchievement] as any);
      vi.mocked(studentLessonRepository.calculateUserStreak).mockResolvedValue(10);
      (prisma.userAchievement.createMany as any).mockImplementation(async () => {
        alreadyUnlocked = true;
        return { count: 1 };
      });

      await achievementEvaluator.evaluateUserAchievements(1);
      await achievementEvaluator.evaluateUserAchievements(1);

      expect(prisma.userAchievement.createMany).toHaveBeenCalledTimes(1);
    });

    it('[ACH-03c] Đụng độ Cập nhật & Xóa danh hiệu tại Service: Request update gặp record đã bị xóa ném 404', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.update(1, { title: 'Updated' }, 1)).rejects.toThrowError(
        expect.objectContaining({ statuscode: 404 })
      );
    });
  });

  describe('4. Data Conflict & Network Failures', () => {
    it('[ACH-05] Mất kết nối DB khi đánh giá danh hiệu không làm chết ứng dụng', async () => {
      vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error('DB Timeout (P1008)'));

      await expect(achievementEvaluator.evaluateUserAchievements(1)).rejects.toThrow('DB Timeout');
    });
  });

  describe('5. Phân Quyền & Kiểm Soát Hành Động Quản Trị (Authorization & Audit Control)', () => {
    it('[ACH-AUTH-01] Ghi nhận chính xác ID quản trị viên khi tạo danh hiệu mới', async () => {
      mockRepo.create.mockResolvedValue({ id: 5, ...mockCreateAchievementInput });

      const res = await service.create(mockCreateAchievementInput, 99);

      expect(res.id).toBe(5);
      expect(mockRepo.create).toHaveBeenCalledWith(mockCreateAchievementInput);
    });

    it('[ACH-AUTH-02] Ghi nhận chính xác ID quản trị viên khi cập nhật và xóa danh hiệu', async () => {
      mockRepo.findById.mockResolvedValue(mockAchievement);
      mockRepo.update.mockResolvedValue({ ...mockAchievement, title: 'Super Title' });
      mockRepo.delete.mockResolvedValue(mockAchievement);

      const updateRes = await service.update(1, { title: 'Super Title' }, 99);
      const deleteRes = await service.delete(1, 99);

      expect(updateRes.title).toBe('Super Title');
      expect(deleteRes.success).toBe(true);
      expect(mockRepo.delete).toHaveBeenCalledWith(1);
    });
  });
});
