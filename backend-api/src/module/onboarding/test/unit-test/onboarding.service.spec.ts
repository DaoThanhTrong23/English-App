import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OnboardingService } from '../../onboarding.service.js';
import { ApiError } from '../../../../shared/http/api-error.js';

vi.mock('../../../../config/prisma.js', () => ({
  prisma: {
    topic: {
      findMany: vi.fn().mockResolvedValue([
        { id: 1, title: 'English for IT', description: 'Tech keywords', cefrLevel: 'B1', lessons: [] },
      ]),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue({ id: 1, username: 'student1' }),
      update: vi.fn().mockResolvedValue({ id: 1, cefrLevel: 'B1' }),
    },
  },
}));

vi.mock('../../notification/notification.service.js', () => ({
  notificationService: {
    notifyAdmins: vi.fn().mockResolvedValue(true),
  },
}));

describe('OnboardingService - Unit Tests (QC 10-Year Standard)', () => {
  let onboardingService: OnboardingService;

  beforeEach(() => {
    vi.clearAllMocks();
    onboardingService = new OnboardingService();
  });

  describe('1. Happy Cases', () => {
    it('[ONB-01a] Lấy danh sách câu hỏi phân loại đầu vào FAME-KT đa kỹ năng', async () => {
      const result = await onboardingService.getPlacementQuestions();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(15);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('question');
      expect(result[0]).toHaveProperty('options');
      expect(result[0]).toHaveProperty('skillCategory');
    });

    it('[ONB-01b] Hoàn tất Onboarding: Tính toán Elo đa chiều và cập nhật CEFR Level', async () => {
      const answers = [
        { id: 'q_a1_g03', answer: 'are', timeTakenMs: 3000 },
        { id: 'q_a2_l03', answer: 'Grilled chicken with salad', timeTakenMs: 4000 },
      ];

      const result = await onboardingService.processOnboarding(
        1,
        'Software Engineer',
        'công nghệ (it)',
        answers
      );

      expect(result).toHaveProperty('cefrLevel');
      expect(result).toHaveProperty('eloProfile');
      expect(result).toHaveProperty('recommendedCourses');
      expect(Array.isArray(result.recommendedCourses)).toBe(true);
    });

    it('[ONB-01c] Kiểm tra hội tụ sớm (checkProgress) khi học viên làm bài', async () => {
      const answers = [
        { id: 'q_a1_g03', answer: 'are', timeTakenMs: 3000 },
      ];

      const result = await onboardingService.checkProgress(answers);

      expect(result).toHaveProperty('stoppedEarly');
    });
  });

  describe('2. Bad End / Negative Cases', () => {
    it('[ONB-02] Gửi danh sách câu hỏi không có id khớp trong ngân hàng câu hỏi', async () => {
      const fakeAnswers = [
        { id: 'non_existent_q_99999', answer: 'nothing', timeTakenMs: 1000 },
      ];

      const result = await onboardingService.processOnboarding(1, 'Dev', 'IT', fakeAnswers);

      expect(result.questionsUsed).toBe(0);
      expect(result.score).toBe('0/0');
    });
  });

  describe('3. Concurrency & Race Condition', () => {
    it('[ONB-03] Nhiều học viên Onboarding song song không làm sai lệch ngân hàng câu hỏi', async () => {
      const answers = [{ id: 'q_a1_g03', answer: 'are' }];

      const p1 = onboardingService.processOnboarding(1, 'Dev', 'công nghệ (it)', answers);
      const p2 = onboardingService.processOnboarding(2, 'Tester', 'kinh doanh', answers);

      const [res1, res2] = await Promise.all([p1, p2]);

      expect(res1.cefrLevel).toBeDefined();
      expect(res2.cefrLevel).toBeDefined();
    });
  });

  describe('4. Data Conflict & Integrity', () => {
    it('[ONB-04] Người dùng không có sở thích nào vẫn gợi ý khóa học an toàn (fallback)', async () => {
      const answers = [{ id: 'q_a1_g03', answer: 'are' }];

      const result = await onboardingService.processOnboarding(1, '', '', answers);

      expect(result.cefrLevel).toBeDefined();
      expect(result.recommendedCourses.length).toBeGreaterThan(0);
    });
  });

  describe('5. Network & Infrastructure Failures', () => {
    it('[ONB-05] Mất kết nối DB khi cập nhật kết quả user ném lỗi hệ thống', async () => {
      const { prisma } = await import('../../../../config/prisma.js');
      vi.mocked(prisma.user.update).mockRejectedValue(new Error('Connection lost (P1001)'));

      const answers = [{ id: 'q_a1_g03', answer: 'are' }];

      await expect(
        onboardingService.processOnboarding(1, 'Dev', 'công nghệ', answers)
      ).rejects.toThrow('Connection lost');
    });
  });
});
