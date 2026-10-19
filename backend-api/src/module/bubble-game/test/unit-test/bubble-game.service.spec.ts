import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BubbleGameService } from '../../bubble-game.service.js';
import { mockBubbleWords, mockMatchPairInput, mockFinishGameInput } from '../data-mock/bubble-game.mock.js';

describe('BubbleGameService - Unit Tests (QC 10-Year Standard)', () => {
  let service: BubbleGameService;
  let mockRepo: any;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new BubbleGameService();
    mockRepo = {
      getWordsForGame: vi.fn(),
      saveTemporaryProgress: vi.fn(),
      finalizeGameResult: vi.fn(),
    };
    (service as any).repository = mockRepo;
  });

  describe('1. Happy Cases', () => {
    it('[BBG-01a] Khởi tạo bàn chơi game bong bóng thành công', async () => {
      mockRepo.getWordsForGame.mockResolvedValue(mockBubbleWords);

      const res = await service.startGame(1, { limit: 4, lessonId: 1 });

      expect(res.totalPairs).toBe(4);
      expect(res.wordBubbles).toHaveLength(4);
      expect(res.meaningBubbles).toHaveLength(4);
      expect(mockRepo.getWordsForGame).toHaveBeenCalledWith(1, 4, 1);
    });

    it('[BBG-01b] Lưu tiến trình tạm thời (match pair) thành công', async () => {
      mockRepo.saveTemporaryProgress.mockResolvedValue(true);

      const res = await service.matchPair(1, mockMatchPairInput);

      expect(res.message).toBe('Lưu tiến trình tạm thời thành công');
      expect(res.currentScore).toBe(20);
      expect(mockRepo.saveTemporaryProgress).toHaveBeenCalled();
    });

    it('[BBG-01c] Kết thúc ván chơi và chốt điểm', async () => {
      mockRepo.finalizeGameResult.mockResolvedValue({
        score: 40,
        duration: 35,
        correctPairs: 4,
        totalPairs: 4,
        currentXp: 100,
      });

      const res = await service.finishGame(1, mockFinishGameInput);

      expect(res.result.totalScore).toBe(40);
      expect(mockRepo.finalizeGameResult).toHaveBeenCalled();
    });
  });

  describe('2. Bad End Cases', () => {
    it('[BBG-02a] Khởi tạo game khi không đủ từ vựng (< 4 từ) ném lỗi 400', async () => {
      mockRepo.getWordsForGame.mockResolvedValue(mockBubbleWords.slice(0, 2));

      await expect(service.startGame(1, { limit: 4 })).rejects.toThrowError(
        expect.objectContaining({ statuscode: 400, code: 'not_enough_words' })
      );
    });

    it('[BBG-02b] Khởi tạo game khi danh sách từ vựng rỗng/null ném lỗi 400', async () => {
      mockRepo.getWordsForGame.mockResolvedValue(null);

      await expect(service.startGame(1, { limit: 4 })).rejects.toThrowError(
        expect.objectContaining({ statuscode: 400, code: 'not_enough_words' })
      );
    });
  });

  describe('3. Concurrency & Network Failures', () => {
    it('[BBG-03] Hai request chốt điểm finishGame gửi đồng thời', async () => {
      mockRepo.finalizeGameResult
        .mockResolvedValueOnce({ score: 40, duration: 35, correctPairs: 4, totalPairs: 4 })
        .mockResolvedValueOnce({ score: 40, duration: 35, correctPairs: 4, totalPairs: 4 });

      const [res1, res2] = await Promise.all([
        service.finishGame(1, mockFinishGameInput),
        service.finishGame(1, mockFinishGameInput),
      ]);

      expect(res1.result.totalScore).toBe(40);
      expect(res2.result.totalScore).toBe(40);
    });

    it('[BBG-05] Mất kết nối DB khi lưu tiến trình ném lỗi', async () => {
      mockRepo.saveTemporaryProgress.mockRejectedValue(new Error('Connection lost (P1001)'));

      await expect(service.matchPair(1, mockMatchPairInput)).rejects.toThrow('Connection lost');
    });
  });
});
