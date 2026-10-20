import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryCardService } from '../../memory-card.service.js';
import {
  mockMemoryWords,
  mockSaveMemoryProgressInput,
  mockFinishMemoryInput,
} from '../data-mock/memory-card.mock.js';
import { activityLogRepository } from '../../../activity-log/activity-log.repository.js';
import { StartMemoryGameSchema, SaveProgressSchema, FinishMemoryGameSchema } from '../../memory-card.schema.js';

vi.mock('../../../activity-log/activity-log.repository.js', () => ({
  activityLogRepository: {
    createLog: vi.fn().mockResolvedValue({ id: 1 }),
  },
}));

describe('MemoryCardService - Unit Tests (QC 10-Year Standard)', () => {
  let service: MemoryCardService;
  let mockRepo: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepo = {
      getWordsForGame: vi.fn(),
      saveTemporaryProgress: vi.fn(),
      finalizeGameResult: vi.fn(),
    };
    service = new MemoryCardService(mockRepo);
  });

  describe('1. Happy Cases', () => {
    it('[MEM-01a] Khởi tạo game lật thẻ tạo đủ 12 thẻ từ 6 từ vựng', async () => {
      mockRepo.getWordsForGame.mockResolvedValue(mockMemoryWords);

      const res = await service.startGame(1, { limit: 6, lessonId: 1 });

      expect(res.totalPairs).toBe(6);
      expect(res.totalCards).toBe(12);
      expect(res.cards).toHaveLength(12);
      expect(mockRepo.getWordsForGame).toHaveBeenCalledWith(1, 6, 1);
    });

    it('[MEM-01b] Lưu tiến trình lật thẻ thành công', async () => {
      mockRepo.saveTemporaryProgress.mockResolvedValue(true);

      const res = await service.saveProgress(1, mockSaveMemoryProgressInput);

      expect(res.message).toBe('Lưu tiến trình tạm thời thành công');
      expect(res.matchedPairs).toBe(3);
      expect(mockRepo.saveTemporaryProgress).toHaveBeenCalled();
    });

    it('[MEM-01c] Chốt kết quả ván chơi lật thẻ', async () => {
      mockRepo.finalizeGameResult.mockResolvedValue({
        score: 60,
        duration: 45,
        turns: 12,
        correctPairs: 6,
        totalPairs: 6,
        currentXp: 180,
      });

      const res = await service.finishGame(1, mockFinishMemoryInput);

      expect(res.result.totalScore).toBe(60);
      expect(res.result.turns).toBe(12);
      expect(mockRepo.finalizeGameResult).toHaveBeenCalled();
    });
  });

  describe('2. Activity Logging Tests', () => {
    it('[MEM-LOG-01] Ghi activity log thành công khi bắt đầu ván Memory Card (USER_START_MEMORY_GAME_SUCCESS)', async () => {
      mockRepo.getWordsForGame.mockResolvedValue(mockMemoryWords);

      await service.startGame(1, { limit: 6 });
      await new Promise((r) => setTimeout(r, 10));

      expect(activityLogRepository.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          actionType: 'USER_START_MEMORY_GAME_SUCCESS',
        })
      );
    });

    it('[MEM-LOG-02] Ghi activity log thất bại khi không đủ từ vựng (USER_START_MEMORY_GAME_FAILED)', async () => {
      mockRepo.getWordsForGame.mockResolvedValue([]);

      await expect(service.startGame(1, { limit: 6 })).rejects.toThrow();
      await new Promise((r) => setTimeout(r, 10));

      expect(activityLogRepository.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          actionType: 'USER_START_MEMORY_GAME_FAILED',
        })
      );
    });

    it('[MEM-LOG-03] Ghi activity log thành công khi lưu tiến trình lật thẻ (USER_SAVE_MEMORY_GAME_PROGRESS_SUCCESS)', async () => {
      mockRepo.saveTemporaryProgress.mockResolvedValue(true);

      await service.saveProgress(1, mockSaveMemoryProgressInput);
      await new Promise((r) => setTimeout(r, 10));

      expect(activityLogRepository.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          actionType: 'USER_SAVE_MEMORY_GAME_PROGRESS_SUCCESS',
        })
      );
    });

    it('[MEM-LOG-04] Ghi activity log thành công khi kết thúc ván Memory Card (USER_FINISH_MEMORY_GAME_SUCCESS)', async () => {
      mockRepo.finalizeGameResult.mockResolvedValue({
        score: 60,
        duration: 45,
        turns: 12,
        correctPairs: 6,
        totalPairs: 6,
      });

      await service.finishGame(1, mockFinishMemoryInput);
      await new Promise((r) => setTimeout(r, 10));

      expect(activityLogRepository.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          actionType: 'USER_FINISH_MEMORY_GAME_SUCCESS',
        })
      );
    });

    it('[MEM-LOG-05] Ghi activity log thất bại khi kết thúc ván chơi lỗi DB (USER_FINISH_MEMORY_GAME_FAILED)', async () => {
      mockRepo.finalizeGameResult.mockRejectedValue(new Error('Memory DB error'));

      await expect(service.finishGame(1, mockFinishMemoryInput)).rejects.toThrow('Memory DB error');
      await new Promise((r) => setTimeout(r, 10));

      expect(activityLogRepository.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          actionType: 'USER_FINISH_MEMORY_GAME_FAILED',
        })
      );
    });
  });

  describe('3. Concurrency & Conflict Tests', () => {
    it('[MEM-CONF-01] Đụng độ khi đang lưu tiến trình lật thẻ thì request chốt kết quả gửi tới đồng thời', async () => {
      mockRepo.saveTemporaryProgress.mockResolvedValue(true);
      mockRepo.finalizeGameResult.mockResolvedValue({
        score: 60,
        duration: 45,
        turns: 12,
        correctPairs: 6,
        totalPairs: 6,
        currentXp: 180,
      });

      const [saveRes, finishRes] = await Promise.all([
        service.saveProgress(1, mockSaveMemoryProgressInput),
        service.finishGame(1, mockFinishMemoryInput),
      ]);

      expect(saveRes.message).toBe('Lưu tiến trình tạm thời thành công');
      expect(finishRes.result.totalScore).toBe(60);
    });

    it('[MEM-CONF-02] Hai request chốt kết quả Memory Card gửi đồng thời với số turns khác nhau', async () => {
      mockRepo.finalizeGameResult
        .mockResolvedValueOnce({ score: 60, duration: 45, turns: 12, correctPairs: 6, totalPairs: 6 })
        .mockResolvedValueOnce({ score: 50, duration: 50, turns: 16, correctPairs: 6, totalPairs: 6 });

      const [res1, res2] = await Promise.all([
        service.finishGame(1, mockFinishMemoryInput),
        service.finishGame(1, { ...mockFinishMemoryInput, turns: 16, totalScore: 50 }),
      ]);

      expect(res1.result.totalScore).toBe(60);
      expect(res2.result.totalScore).toBe(50);
      expect(mockRepo.finalizeGameResult).toHaveBeenCalledTimes(2);
    });

    it('[MEM-03] Hai request chốt điểm Memory Card song song', async () => {
      mockRepo.finalizeGameResult
        .mockResolvedValueOnce({ score: 60, duration: 45, turns: 12, correctPairs: 6, totalPairs: 6 })
        .mockResolvedValueOnce({ score: 60, duration: 45, turns: 12, correctPairs: 6, totalPairs: 6 });

      const [res1, res2] = await Promise.all([
        service.finishGame(1, mockFinishMemoryInput),
        service.finishGame(1, mockFinishMemoryInput),
      ]);

      expect(res1.result.totalScore).toBe(60);
      expect(res2.result.totalScore).toBe(60);
    });
  });

  describe('4. Bad End & Schema Validation Cases', () => {
    it('[MEM-02a] Khởi tạo ván chơi khi thiếu từ vựng (< limit) ném lỗi 400', async () => {
      mockRepo.getWordsForGame.mockResolvedValue(mockMemoryWords.slice(0, 4));

      await expect(service.startGame(1, { limit: 6 })).rejects.toThrowError(
        expect.objectContaining({ statuscode: 400, code: 'not_enough_words' })
      );
    });

    it('[MEM-02b] Khởi tạo khi repository trả về mảng rỗng ném lỗi 400', async () => {
      mockRepo.getWordsForGame.mockResolvedValue([]);

      await expect(service.startGame(1, { limit: 6 })).rejects.toThrowError(
        expect.objectContaining({ statuscode: 400, code: 'not_enough_words' })
      );
    });

    it('[MEM-VAL-01] Validation: Chặn StartMemoryGameSchema khi limit < 2 hoặc limit > 12 hoặc lessonId <= 0', () => {
      const parsed1 = StartMemoryGameSchema.safeParse({ query: { limit: 1 } });
      expect(parsed1.success).toBe(false);

      const parsed2 = StartMemoryGameSchema.safeParse({ query: { limit: 15 } });
      expect(parsed2.success).toBe(false);

      const parsed3 = StartMemoryGameSchema.safeParse({ query: { lessonId: -5 } });
      expect(parsed3.success).toBe(false);
    });

    it('[MEM-VAL-02] Validation: Chặn SaveProgressSchema khi currentScore âm, turns âm hoặc totalPairs <= 0', () => {
      const parsed1 = SaveProgressSchema.safeParse({
        body: { currentScore: -5, matchedPairs: 2, totalPairs: 6, turns: 4 },
      });
      expect(parsed1.success).toBe(false);

      const parsed2 = SaveProgressSchema.safeParse({
        body: { currentScore: 20, matchedPairs: 2, totalPairs: 6, turns: -1 },
      });
      expect(parsed2.success).toBe(false);

      const parsed3 = SaveProgressSchema.safeParse({
        body: { currentScore: 20, matchedPairs: 2, totalPairs: 0, turns: 4 },
      });
      expect(parsed3.success).toBe(false);
    });

    it('[MEM-VAL-03] Validation: Chặn FinishMemoryGameSchema khi totalScore âm, duration âm hoặc correctPairs âm', () => {
      const parsed1 = FinishMemoryGameSchema.safeParse({
        body: { totalScore: -10, duration: 30, turns: 10, correctPairs: 6, totalPairs: 6 },
      });
      expect(parsed1.success).toBe(false);

      const parsed2 = FinishMemoryGameSchema.safeParse({
        body: { totalScore: 60, duration: -1, turns: 10, correctPairs: 6, totalPairs: 6 },
      });
      expect(parsed2.success).toBe(false);

      const parsed3 = FinishMemoryGameSchema.safeParse({
        body: { totalScore: 60, duration: 30, turns: 10, correctPairs: -2, totalPairs: 6 },
      });
      expect(parsed3.success).toBe(false);
    });

    it('[MEM-05] Mất kết nối database khi lưu tiến trình ném lỗi', async () => {
      mockRepo.saveTemporaryProgress.mockRejectedValue(new Error('Connection lost (P1001)'));

      await expect(service.saveProgress(1, mockSaveMemoryProgressInput)).rejects.toThrow(
        'Connection lost'
      );
    });
  });
});
