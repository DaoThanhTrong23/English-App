import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StudentVocabularyService } from '../../student-vocabulary.service.js';
import { mockWord, mockUserProgress } from '../data-mock/student-vocabulary.mock.js';
import { ApiError } from '../../../../shared/http/api-error.js';
import { prisma } from '../../../../config/prisma.js';

vi.mock('../../../../config/prisma.js', () => ({
  prisma: {
    word: {
      findUnique: vi.fn(),
    },
    userProgress: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
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

    it('[STV-TOG-01] Bookmark Toggle: Lưu từ vựng mới vào danh sách học viên (isSaved = true)', async () => {
      vi.mocked(prisma.word.findUnique).mockResolvedValue(mockWord as any);
      vi.mocked(prisma.userProgress.findUnique).mockResolvedValue(null); // chưa lưu
      vi.mocked(prisma.userProgress.create).mockResolvedValue(mockUserProgress as any);

      const res = await service.toggleVocabulary(1, 10);

      expect(res.isSaved).toBe(true);
      expect(res.wordId).toBe(10);
      expect(prisma.userProgress.create).toHaveBeenCalled();
    });

    it('[STV-TOG-02] Bookmark Toggle: Bỏ lưu từ vựng đã có sẵn trong danh sách (isSaved = false)', async () => {
      vi.mocked(prisma.word.findUnique).mockResolvedValue(mockWord as any);
      vi.mocked(prisma.userProgress.findUnique).mockResolvedValue(mockUserProgress as any); // đã lưu
      vi.mocked(prisma.userProgress.delete).mockResolvedValue(mockUserProgress as any);

      const res = await service.toggleVocabulary(1, 10);

      expect(res.isSaved).toBe(false);
      expect(res.wordId).toBe(10);
      expect(prisma.userProgress.delete).toHaveBeenCalledWith({ where: { id: mockUserProgress.id } });
    });

    it('[STV-REV-01] Lấy danh sách từ vựng đến hạn ôn tập (Spaced Repetition)', async () => {
      vi.mocked(prisma.userProgress.findMany).mockResolvedValue([mockUserProgress as any]);

      const res = await service.getDueReviews(1);

      expect(res).toHaveLength(1);
      expect(res[0].wordId).toBe(10);
      expect(prisma.userProgress.findMany).toHaveBeenCalled();
    });

    it('[STV-PER-01] Cá nhân hóa: Danh sách từ vựng và lịch ôn tập của User A hoàn toàn độc lập với User B', async () => {
      mockRepo.findWithLazyLoading.mockResolvedValueOnce({
        items: [{ id: 1, userId: 1, wordId: 10, memoryLevel: 3, status: 'learning' }],
        pagination: { limit: 10, nextCursor: null, hasMore: false, totalItems: 1 },
      }).mockResolvedValueOnce({
        items: [{ id: 2, userId: 2, wordId: 20, memoryLevel: 1, status: 'new' }],
        pagination: { limit: 10, nextCursor: null, hasMore: false, totalItems: 1 },
      });

      const resUserA = await service.getVocabularyList(1, { limit: 10 });
      const resUserB = await service.getVocabularyList(2, { limit: 10 });

      expect(resUserA.items[0].userId).toBe(1);
      expect(resUserB.items[0].userId).toBe(2);
      expect(resUserA.items[0].wordId).not.toBe(resUserB.items[0].wordId);
      expect(mockRepo.findWithLazyLoading).toHaveBeenCalledWith(1, 10, undefined, undefined);
      expect(mockRepo.findWithLazyLoading).toHaveBeenCalledWith(2, 10, undefined, undefined);
    });
  });

  describe('2. Bad End Cases', () => {
    it('[STV-02a] Xem chi tiết từ vựng không tồn tại hoặc của học viên khác (IDOR) ném lỗi 404', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.getVocabularyDetail(1, 999)).rejects.toThrowError(
        expect.objectContaining({ statuscode: 404 })
      );
    });

    it('[STV-IDOR-02] Chống IDOR: User A cố tình cập nhật từ vựng của User B ném lỗi 404 vocabulary_not_found', async () => {
      // User A (userId = 1) cố tình update record ID 99 (thuộc User B)
      mockRepo.findById.mockResolvedValue(null); // findById(99, 1) trả về null

      await expect(
        service.updateVocabulary(1, 99, { status: 'mastered', memoryLevel: 5 })
      ).rejects.toThrowError(
        expect.objectContaining({ statuscode: 404, code: 'vocabulary_not_found' })
      );
      expect(mockRepo.findById).toHaveBeenCalledWith(99, 1);
    });

    it('[STV-IDOR-03] Chống IDOR: User A cố tình xóa từ vựng trong sổ tay của User B ném lỗi 404 vocabulary_not_found', async () => {
      // User A (userId = 1) cố tình delete record ID 99 (thuộc User B)
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.deleteVocabulary(1, 99)).rejects.toThrowError(
        expect.objectContaining({ statuscode: 404, code: 'vocabulary_not_found' })
      );
      expect(mockRepo.findById).toHaveBeenCalledWith(99, 1);
    });

    it('[STV-02b] Thêm từ vựng với wordId không tồn tại ném lỗi 404', async () => {
      mockRepo.findWordById.mockResolvedValue(null);

      await expect(service.addVocabulary(1, { wordId: 999, status: 'new' })).rejects.toThrowError(
        expect.objectContaining({ statuscode: 404 })
      );
    });

    it('[STV-TOG-03] Toggle từ vựng khi wordId không tồn tại trong hệ thống ném 404 word_not_found', async () => {
      vi.mocked(prisma.word.findUnique).mockResolvedValue(null);

      await expect(service.toggleVocabulary(1, 9999)).rejects.toThrowError(
        expect.objectContaining({ statuscode: 404, code: 'word_not_found' })
      );
    });

    it('[STV-REV-02] Ôn tập từ vựng không tìm thấy tiến trình ném lỗi 404', async () => {
      vi.mocked(prisma.userProgress.findUnique).mockResolvedValue(null);

      await expect(service.submitReview(1, 999, true)).rejects.toThrowError(
        expect.objectContaining({ statuscode: 404 })
      );
    });
  });

  describe('3. Concurrency & Race Cases', () => {
    it('[STV-03] Nộp ôn tập song song nhiều từ vựng được thực thi an toàn', async () => {
      vi.mocked(prisma.userProgress.findUnique).mockResolvedValue(mockUserProgress as any);

      const p1 = service.submitReview(1, 10, true);
      const p2 = service.submitReview(1, 10, true);

      await Promise.all([p1, p2]);
      expect(prisma.$transaction).toHaveBeenCalledTimes(2);
    });

    it('[STV-TOG-CONF-01] Xung đột: Hai request toggle cùng một từ đồng thời xử lý an toàn', async () => {
      vi.mocked(prisma.word.findUnique).mockResolvedValue(mockWord as any);
      vi.mocked(prisma.userProgress.findUnique)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockUserProgress as any);
      vi.mocked(prisma.userProgress.create).mockResolvedValue(mockUserProgress as any);
      vi.mocked(prisma.userProgress.delete).mockResolvedValue(mockUserProgress as any);

      const [res1, res2] = await Promise.all([
        service.toggleVocabulary(1, 10),
        service.toggleVocabulary(1, 10),
      ]);

      expect(res1.isSaved).toBe(true);
      expect(res2.isSaved).toBe(false);
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

    it('[STV-REV-04] Mất kết nối DB khi lấy danh sách từ đến hạn ôn tập ném lỗi', async () => {
      vi.mocked(prisma.userProgress.findMany).mockRejectedValue(new Error('Connection lost (P1001)'));

      await expect(service.getDueReviews(1)).rejects.toThrow('Connection lost');
    });
  });
});
