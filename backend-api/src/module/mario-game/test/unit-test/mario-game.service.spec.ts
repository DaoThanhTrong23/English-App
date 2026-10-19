import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MarioGameService } from '../../mario-game.service.js';
import { mockMarioWords, mockMarioMatchPairInput, mockMarioFinishGameInput } from '../data-mock/mario-game.mock.js';

describe('MarioGameService - Unit Tests (QC 10-Year Standard)', () => {
  let service: MarioGameService;
  let mockRepo: any;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new MarioGameService();
    mockRepo = {
      getWordsForGame: vi.fn(),
      saveTemporaryProgress: vi.fn(),
      finalizeGameResult: vi.fn(),
    };
    (service as any).repository = mockRepo;
  });

  describe('1. Happy Cases', () => {
    it('[MARIO-01a] Khởi tạo game Mario thành công', async () => {
      mockRepo.getWordsForGame.mockResolvedValue(mockMarioWords);

      const res = await service.startGame(1, { limit: 4, lessonId: 2 });

      expect(res.totalWords).toBe(4);
      expect(res.words).toHaveLength(4);
      expect(mockRepo.getWordsForGame).toHaveBeenCalledWith(1, 4, 2);
    });

    it('[MARIO-01b] Lưu tiến trình tạm thời thành công', async () => {
      mockRepo.saveTemporaryProgress.mockResolvedValue(true);

      const res = await service.matchPair(1, mockMarioMatchPairInput);

      expect(res.message).toBe('Lưu tiến trình tạm thời thành công');
      expect(res.currentScore).toBe(50);
      expect(mockRepo.saveTemporaryProgress).toHaveBeenCalled();
    });

    it('[MARIO-01c] Kết thúc ván Mario và chốt điểm', async () => {
      mockRepo.finalizeGameResult.mockResolvedValue({
        score: 100,
        duration: 40,
        correctPairs: 4,
        totalPairs: 4,
        currentXp: 150,
      });

      const res = await service.finishGame(1, mockMarioFinishGameInput);

      expect(res.result.totalScore).toBe(100);
      expect(mockRepo.finalizeGameResult).toHaveBeenCalled();
    });
  });

  describe('2. Bad End Cases', () => {
    it('[MARIO-02a] Khởi tạo Mario game khi không đủ từ vựng (< 4 từ) ném 400', async () => {
      mockRepo.getWordsForGame.mockResolvedValue(mockMarioWords.slice(0, 3));

      await expect(service.startGame(1, { limit: 4 })).rejects.toThrowError(
        expect.objectContaining({ statuscode: 400, code: 'not_enough_words' })
      );
    });

    it('[MARIO-02b] Khởi tạo game khi repository trả về null ném 400', async () => {
      mockRepo.getWordsForGame.mockResolvedValue(null);

      await expect(service.startGame(1, { limit: 4 })).rejects.toThrowError(
        expect.objectContaining({ statuscode: 400, code: 'not_enough_words' })
      );
    });
  });

  describe('3. Concurrency & Network Failures', () => {
    it('[MARIO-03] Hai request chốt điểm finishGame gửi đồng thời', async () => {
      mockRepo.finalizeGameResult
        .mockResolvedValueOnce({ score: 100, duration: 40, correctPairs: 4, totalPairs: 4 })
        .mockResolvedValueOnce({ score: 100, duration: 40, correctPairs: 4, totalPairs: 4 });

      const [res1, res2] = await Promise.all([
        service.finishGame(1, mockMarioFinishGameInput),
        service.finishGame(1, mockMarioFinishGameInput),
      ]);

      expect(res1.result.totalScore).toBe(100);
      expect(res2.result.totalScore).toBe(100);
    });

    it('[MARIO-05] Mất kết nối DB khi lưu tiến trình ném lỗi', async () => {
      mockRepo.saveTemporaryProgress.mockRejectedValue(new Error('Connection lost (P1001)'));

      await expect(service.matchPair(1, mockMarioMatchPairInput)).rejects.toThrow('Connection lost');
    });
  });
});
