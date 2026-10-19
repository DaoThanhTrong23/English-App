import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryCardService } from '../../memory-card.service.js';
import {
  mockMemoryWords,
  mockSaveMemoryProgressInput,
  mockFinishMemoryInput,
} from '../data-mock/memory-card.mock.js';

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

  describe('2. Bad End Cases', () => {
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
  });

  describe('3. Concurrency & Network Failures', () => {
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

    it('[MEM-05] Mất kết nối database khi lưu tiến trình ném lỗi', async () => {
      mockRepo.saveTemporaryProgress.mockRejectedValue(new Error('Connection lost (P1001)'));

      await expect(service.saveProgress(1, mockSaveMemoryProgressInput)).rejects.toThrow(
        'Connection lost'
      );
    });
  });
});
