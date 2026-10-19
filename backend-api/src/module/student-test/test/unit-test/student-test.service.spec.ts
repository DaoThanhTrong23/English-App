import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StudentTestService } from '../../student-test.service.js';
import { mockStudentTest, mockTestUser, mockTestSubmission } from '../data-mock/student-test.mock.js';
import { prisma } from '../../../../config/prisma.js';
import { achievementEvaluator } from '../../../achievement/achievement.evaluator.js';

vi.mock('../../../../config/prisma.js', () => ({
  prisma: {
    test: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    userTestResult: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    assessmentHistory: {
      createMany: vi.fn(),
    },
    $transaction: vi.fn(async (cb: any) => {
      const tx = {
        userTestResult: { create: vi.fn().mockResolvedValue({ id: 1 }) },
        assessmentHistory: { createMany: vi.fn().mockResolvedValue({ count: 2 }) },
        user: { update: vi.fn().mockResolvedValue(mockTestUser) },
      };
      return await cb(tx);
    }),
  },
}));

vi.mock('../../../achievement/achievement.evaluator.js', () => ({
  achievementEvaluator: {
    evaluateUserAchievements: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../../notification/notification.service.js', () => ({
  notificationService: {
    notifyAdmins: vi.fn().mockResolvedValue(true),
  },
}));

describe('StudentTestService - Unit Tests (QC 10-Year Standard)', () => {
  let service: StudentTestService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new StudentTestService();
  });

  describe('1. Happy Cases', () => {
    it('[STT-01a] Lấy chi tiết bài kiểm tra thành công (ẩn đáp án đúng)', async () => {
      (prisma.test.findUnique as any).mockResolvedValue(mockStudentTest);

      const res = await service.getTestDetail(1);

      expect(res.id).toBe(1);
      expect(res.questions).toHaveLength(2);
      expect(prisma.test.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 } })
      );
    });

    it('[STT-01b] Nộp bài thi lần đầu: chấm đúng 2 câu, cập nhật Elo & XP', async () => {
      (prisma.test.findUnique as any).mockResolvedValue(mockStudentTest);
      (prisma.user.findUnique as any).mockResolvedValue(mockTestUser);
      (prisma.userTestResult.findFirst as any).mockResolvedValue(null); // not a retake

      const res = await service.submitTest(1, 1, mockTestSubmission);

      expect(res.totalScore).toBe(20);
      expect(res.correctCount).toBe(2);
      expect(res.totalQuestions).toBe(2);
      expect(res.xpGained).toBe(20);
      expect(res.isRetake).toBe(false);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(achievementEvaluator.evaluateUserAchievements).toHaveBeenCalledWith(1);
    });

    it('[STT-01c] Nộp bài thi thi lại (retake): chống cày điểm (xpGained = 0)', async () => {
      (prisma.test.findUnique as any).mockResolvedValue(mockStudentTest);
      (prisma.user.findUnique as any).mockResolvedValue(mockTestUser);
      (prisma.userTestResult.findFirst as any).mockResolvedValue({ id: 99 }); // already taken

      const res = await service.submitTest(1, 1, mockTestSubmission);

      expect(res.totalScore).toBe(20);
      expect(res.isRetake).toBe(true);
      expect(res.xpGained).toBe(0);
    });
  });

  describe('2. Bad End Cases', () => {
    it('[STT-02a] Nộp bài kiểm tra không tồn tại ném lỗi 404', async () => {
      (prisma.test.findUnique as any).mockResolvedValue(null);

      await expect(service.submitTest(1, 999, mockTestSubmission)).rejects.toThrowError(
        expect.objectContaining({ statuscode: 404, code: 'test_not_found' })
      );
    });

    it('[STT-02b] Nộp bài với user không tồn tại ném lỗi 404', async () => {
      (prisma.test.findUnique as any).mockResolvedValue(mockStudentTest);
      (prisma.user.findUnique as any).mockResolvedValue(null);

      await expect(service.submitTest(999, 1, mockTestSubmission)).rejects.toThrowError(
        expect.objectContaining({ statuscode: 404, code: 'user_not_found' })
      );
    });

    it('[STT-02c] Lấy chi tiết bài kiểm tra không tồn tại ném lỗi 404', async () => {
      (prisma.test.findUnique as any).mockResolvedValue(null);

      await expect(service.getTestDetail(999)).rejects.toThrowError(
        expect.objectContaining({ statuscode: 404, code: 'test_not_found' })
      );
    });
  });

  describe('3. Concurrency & Network Failures', () => {
    it('[STT-03] Hai yêu cầu nộp bài đồng thời cùng lúc', async () => {
      (prisma.test.findUnique as any).mockResolvedValue(mockStudentTest);
      (prisma.user.findUnique as any).mockResolvedValue(mockTestUser);
      (prisma.userTestResult.findFirst as any)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 1 });

      const [res1, res2] = await Promise.all([
        service.submitTest(1, 1, mockTestSubmission),
        service.submitTest(1, 1, mockTestSubmission),
      ]);

      expect(res1.isRetake).toBe(false);
      expect(res2.isRetake).toBe(true);
    });

    it('[STT-05] Mất kết nối database khi nộp bài thi ném lỗi', async () => {
      (prisma.test.findUnique as any).mockRejectedValue(new Error('Connection lost (P1001)'));

      await expect(service.submitTest(1, 1, mockTestSubmission)).rejects.toThrow(
        'Connection lost'
      );
    });
  });
});
