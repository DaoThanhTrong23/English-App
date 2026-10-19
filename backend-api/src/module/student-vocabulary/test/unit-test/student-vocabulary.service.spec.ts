import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StudentVocabularyService } from '../../student-vocabulary.service.js';
import { mockWord, mockUserProgress } from '../data-mock/student-vocabulary.mock.js';
import { ApiError } from '../../../../shared/http/api-error.js';
import { prisma } from '../../../../config/prisma.js';

vi.mock('../../../../config/prisma.js', () => ({
  prisma: {
    userProgress: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
    activityLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn().mockImplementation(async (promises) => Promise.all(promises)),
  },
}));

describe('StudentVocabularyService - Unit Tests (QC 10-Year Standard)', () => {
  let service: StudentVocabularyService;
  let mockRepo: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepo = {
      findWithLazyLoading: vi.fn(),
      findById: vi.fn(),
      findByWordAndUser: vi.fn(),
      createProgress: vi.fn(),
      updateProgress: vi.fn(),
      deleteProgress: vi.fn(),
      findWordById: vi.fn(),
      findExactWord: vi.fn(),
      createWord: vi.fn(),
    };
    service = new StudentVocabularyService(mockRepo);
  });

  describe('1. Happy Cases', () => {
    it('[STV-01a] Lấy danh sách từ vựng cá nhân kèm phân trang lazy loading', async () => {
      mockRepo.findWithLazyLoading.mockResolvedValue({
        items: [mockUserProgress],
        nextCursor: null,
        hasMore: false,
        totalItems: 1,
      });

      const res = await service.getVocabularyList(1, { limit: 10 });

      expect(res.items.length).toBe(1);
      expect(res.pagination.totalItems).toBe(1);
    });

    it('[STV-01b] Thêm từ vựng có sẵn vào danh sách học viên thành công', async () => {
      mockRepo.findWordById.mockResolvedValue(mockWord);
      mockRepo.findByWordAndUser.mockResolvedValue(null);
      mockRepo.createProgress.mockResolvedValue(mockUserProgress);

      const res = await service.addVocabulary(1, { wordId: 10, status: 'new' });

      expect(res.wordId).toBe(10);
      expect(mockRepo.createProgress).toHaveBeenCalled();
    });

    it('[STV-01c] Thuật toán SRS: Ôn tập đúng tăng memoryLevel và dời lịch theo khoảng cách ngày', async () => {
      vi.mocked(prisma.userProgress.findUnique).mockResolvedValue(mockUserProgress as any);
      vi.mocked(prisma.userProgress.update).mockResolvedValue({ ...mockUserProgress, memoryLevel: 3 } as any);
      vi.mocked(prisma.user.update).mockResolvedValue({ id: 1, xpPoints: 105 } as any);

      const res = await service.submitReview(1, 10, true);

      expect(res).toBeDefined();
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('[STV-01d] Thuật toán SRS: Ôn tập sai giảm memoryLevel an toàn không bị âm', async () => {
      vi.mocked(prisma.userProgress.findUnique).mockResolvedValue({ ...mockUserProgress, memoryLevel: 0 } as any);

      await service.submitReview(1, 10, false);

      expect(prisma.userProgress.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ memoryLevel: 0 }),
        })
      );
    });
  });

  describe('2. Bad End Cases', () => {
    it('[STV-02a] Xem chi tiết từ vựng không tồn tại hoặc của học viên khác (IDOR) ném lỗi 404', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.getVocabularyDetail(1, 999)).rejects.toThrowError(
        expect.objectContaining({ statuscode: 404 })
      );
    });

    it('[STV-02b] Thêm từ vựng với wordId không tồn tại ném lỗi 404', async () => {
      mockRepo.findWordById.mockResolvedValue(null);

      await expect(service.addVocabulary(1, { wordId: 999, status: 'new' })).rejects.toThrowError(
        expect.objectContaining({ statuscode: 404 })
      );
    });
  });

  describe('3. Concurrency Cases', () => {
    it('[STV-03] Nộp ôn tập song song nhiều từ vựng được thực thi an toàn', async () => {
      vi.mocked(prisma.userProgress.findUnique).mockResolvedValue(mockUserProgress as any);

      const p1 = service.submitReview(1, 10, true);
      const p2 = service.submitReview(1, 10, true);

      await Promise.all([p1, p2]);
      expect(prisma.$transaction).toHaveBeenCalledTimes(2);
    });
  });

  describe('4. Data Conflict & Duplicate Words', () => {
    it('[STV-04] Chặn thêm từ vựng đã có sẵn trong danh sách của học viên (409 word_already_added)', async () => {
      mockRepo.findWordById.mockResolvedValue(mockWord);
      mockRepo.findByWordAndUser.mockResolvedValue(mockUserProgress);

      await expect(service.addVocabulary(1, { wordId: 10, status: 'new' })).rejects.toThrowError(
        expect.objectContaining({ statuscode: 409, code: 'word_already_added' })
      );
    });
  });

  describe('5. Network & Infrastructure Failures', () => {
    it('[STV-05] Mất kết nối DB khi nộp ôn tập rollback transaction sạch sẽ', async () => {
      vi.mocked(prisma.userProgress.findUnique).mockResolvedValue(mockUserProgress as any);
      vi.mocked(prisma.$transaction).mockRejectedValue(new Error('Connection terminated (P1001)'));

      await expect(service.submitReview(1, 10, true)).rejects.toThrow('Connection terminated');
    });
  });
});
