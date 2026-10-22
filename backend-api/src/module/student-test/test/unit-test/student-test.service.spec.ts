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
      (prisma.user.findUnique as any).mockResolvedValue(mockTestUser);

      const res = await service.getTestDetail(1, 1);

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

    it('[STT-01d] Thí sinh làm bài thi trình độ tương thích (A1 làm bài A2) thành công', async () => {
      const compatibleTest = { ...mockStudentTest, ceftLevel: 'A2' };
      (prisma.test.findUnique as any).mockResolvedValue(compatibleTest);
      (prisma.user.findUnique as any).mockResolvedValue({ ...mockTestUser, cefrLevel: 'A1' });
      (prisma.userTestResult.findFirst as any).mockResolvedValue(null);

      const res = await service.submitTest(1, 1, mockTestSubmission);

      expect(res.totalScore).toBe(20);
      expect(res.isRetake).toBe(false);
    });
  });

  describe('2. Candidate Level Discrepancy (Chênh Lệch Trình Độ Thí Sinh & Bài Thi)', () => {
    it('[STT-DISC-01] Thí sinh A1 có thể tự do mở xem bài kiểm tra cấp độ cao hơn (C1) mà không bị chặn', async () => {
      const advancedTest = { ...mockStudentTest, ceftLevel: 'C1' };
      (prisma.test.findUnique as any).mockResolvedValue(advancedTest);
      (prisma.user.findUnique as any).mockResolvedValue({ ...mockTestUser, cefrLevel: 'A1' });

      const res = await service.getTestDetail(1, 1);
      expect(res.id).toBe(1);
    });

    it('[STT-DISC-02] Thí sinh A1 có thể tự do nộp bài thi cấp độ cao hơn (B2/C1) mà không bị chặn', async () => {
      const advancedTest = { ...mockStudentTest, ceftLevel: 'B2' };
      (prisma.test.findUnique as any).mockResolvedValue(advancedTest);
      (prisma.user.findUnique as any).mockResolvedValue({ ...mockTestUser, cefrLevel: 'A1' });
      (prisma.userTestResult.findFirst as any).mockResolvedValue(null);

      const res = await service.submitTest(1, 1, mockTestSubmission);
      expect(res.totalScore).toBe(20);
    });

    it('[STT-DISC-03] Thí sinh trình độ cao (C1) làm bài thi cấp độ thấp (A1): Hệ thống xử lý an toàn', async () => {
      const beginnerTest = { ...mockStudentTest, ceftLevel: 'A1' };
      (prisma.test.findUnique as any).mockResolvedValue(beginnerTest);
      (prisma.user.findUnique as any).mockResolvedValue({ ...mockTestUser, cefrLevel: 'C1', grammarElo: 1800, vocabElo: 1800, readingElo: 1800, listeningElo: 1800 });
      (prisma.userTestResult.findFirst as any).mockResolvedValue(null);

      const res = await service.submitTest(1, 1, mockTestSubmission);

      expect(res.totalScore).toBe(20);
      expect(res.isRetake).toBe(false);
    });
  });

  describe('3. Cross-Topic Access Control (Chặn Truy Cập Bài Thi Của Topic Khác)', () => {
    it('[STT-TOPIC-01] Chặn học viên Topic 1 mở bài thi thuộc Topic 2 (khác lộ trình) ném 403 topic_access_denied', async () => {
      const otherTopicTest = {
        ...mockStudentTest,
        lesson: { id: 20, topicId: 2, cefrLevel: 'A1' },
      };
      (prisma.test.findUnique as any).mockResolvedValue(otherTopicTest);
      (prisma.user.findUnique as any).mockResolvedValue({
        ...mockTestUser,
        preferredTopics: '1', // Chỉ đăng ký topic 1
      });

      await expect(service.getTestDetail(1, 1)).rejects.toThrowError(
        expect.objectContaining({ statuscode: 403, code: 'topic_access_denied' })
      );
    });

    it('[STT-TOPIC-02] Chặn học viên nộp bài thi thuộc Topic khác ngoài danh sách đăng ký ném 403 topic_access_denied', async () => {
      const otherTopicTest = {
        ...mockStudentTest,
        lesson: { id: 20, topicId: 5, cefrLevel: 'A1' },
      };
      (prisma.test.findUnique as any).mockResolvedValue(otherTopicTest);
      (prisma.user.findUnique as any).mockResolvedValue({
        ...mockTestUser,
        preferredTopics: '1,2,3', // Không có topic 5
      });

      await expect(service.submitTest(1, 1, mockTestSubmission)).rejects.toThrowError(
        expect.objectContaining({ statuscode: 403, code: 'topic_access_denied' })
      );
    });

    it('[STT-TOPIC-03] Cho phép học viên mở bài thi thuộc Topic đã đăng ký', async () => {
      const validTopicTest = {
        ...mockStudentTest,
        lesson: { id: 10, topicId: 1, cefrLevel: 'A1' },
      };
      (prisma.test.findUnique as any).mockResolvedValue(validTopicTest);
      (prisma.user.findUnique as any).mockResolvedValue({
        ...mockTestUser,
        preferredTopics: '1,2',
      });

      const res = await service.getTestDetail(1, 1);

      expect(res.id).toBe(1);
    });
  });

  describe('4. Bad End Cases', () => {
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

  describe('5. Concurrency & Network Failures', () => {
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
