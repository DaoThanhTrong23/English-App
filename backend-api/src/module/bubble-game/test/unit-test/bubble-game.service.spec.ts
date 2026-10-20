import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BubbleGameService } from '../../bubble-game.service.js';
import { mockBubbleWords, mockMatchPairInput, mockFinishGameInput } from '../data-mock/bubble-game.mock.js';
import { activityLogRepository } from '../../../activity-log/activity-log.repository.js';
import { StartGameSchema, MatchPairSchema, FinishGameSchema } from '../../bubble-game.schema.js';

vi.mock('../../../activity-log/activity-log.repository.js', () => ({
  activityLogRepository: {
    createLog: vi.fn().mockResolvedValue({ id: 1 }),
  },
}));

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

  describe('2. Activity Logging Tests', () => {
    it('[BBG-LOG-01] Ghi activity log thành công khi bắt đầu ván chơi (USER_START_GAME_SUCCESS)', async () => {
      mockRepo.getWordsForGame.mockResolvedValue(mockBubbleWords);

      await service.startGame(1, { limit: 4 });
      await new Promise((r) => setTimeout(r, 10));

      expect(activityLogRepository.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          actionType: 'USER_START_GAME_SUCCESS',
        })
      );
    });

    it('[BBG-LOG-02] Ghi activity log thất bại khi không đủ từ vựng (USER_START_GAME_FAILED)', async () => {
      mockRepo.getWordsForGame.mockResolvedValue([]);

      await expect(service.startGame(1, { limit: 4 })).rejects.toThrow();
      await new Promise((r) => setTimeout(r, 10));

      expect(activityLogRepository.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          actionType: 'USER_START_GAME_FAILED',
        })
      );
    });

    it('[BBG-LOG-03] Ghi activity log thành công khi lưu tiến trình tạm (USER_SAVE_PROCESS_GAME_SUCCESS)', async () => {
      mockRepo.saveTemporaryProgress.mockResolvedValue(true);

      await service.matchPair(1, mockMatchPairInput);
      await new Promise((r) => setTimeout(r, 10));

      expect(activityLogRepository.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          actionType: 'USER_SAVE_PROCESS_GAME_SUCCESS',
        })
      );
    });

    it('[BBG-LOG-04] Ghi activity log thành công khi kết thúc ván chơi (USER_FINISH_GAME_SUCCESS)', async () => {
      mockRepo.finalizeGameResult.mockResolvedValue({
        score: 40,
        duration: 35,
        correctPairs: 4,
        totalPairs: 4,
      });

      await service.finishGame(1, mockFinishGameInput);
      await new Promise((r) => setTimeout(r, 10));

      expect(activityLogRepository.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          actionType: 'USER_FINISH_GAME_SUCCESS',
        })
      );
    });

    it('[BBG-LOG-05] Ghi activity log thất bại khi kết thúc ván chơi bị lỗi DB (USER_FINISH_GAME_FAILED)', async () => {
      mockRepo.finalizeGameResult.mockRejectedValue(new Error('Database write error'));

      await expect(service.finishGame(1, mockFinishGameInput)).rejects.toThrow('Database write error');
      await new Promise((r) => setTimeout(r, 10));

      expect(activityLogRepository.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          actionType: 'USER_FINISH_GAME_FAILED',
        })
      );
    });
  });

  describe('3. Concurrency & Conflict Tests', () => {
    it('[BBG-CONF-01] Đụng độ khi đang lưu tiến trình tạm nhưng có request kết thúc ván chơi diễn ra đồng thời', async () => {
      mockRepo.saveTemporaryProgress.mockResolvedValue(true);
      mockRepo.finalizeGameResult.mockResolvedValue({
        score: 40,
        duration: 35,
        correctPairs: 4,
        totalPairs: 4,
      });

      const [saveRes, finishRes] = await Promise.all([
        service.matchPair(1, mockMatchPairInput),
        service.finishGame(1, mockFinishGameInput),
      ]);

      expect(saveRes.message).toBe('Lưu tiến trình tạm thời thành công');
      expect(finishRes.result.totalScore).toBe(40);
    });

    it('[BBG-CONF-02] Hai request chốt điểm finishGame gửi đồng thời với số điểm khác nhau (race condition)', async () => {
      mockRepo.finalizeGameResult
        .mockResolvedValueOnce({ score: 40, duration: 35, correctPairs: 4, totalPairs: 4 })
        .mockResolvedValueOnce({ score: 50, duration: 40, correctPairs: 5, totalPairs: 5 });

      const [res1, res2] = await Promise.all([
        service.finishGame(1, mockFinishGameInput),
        service.finishGame(1, { ...mockFinishGameInput, totalScore: 50, correctPairs: 5 }),
      ]);

      expect(res1.result.totalScore).toBe(40);
      expect(res2.result.totalScore).toBe(50);
      expect(mockRepo.finalizeGameResult).toHaveBeenCalledTimes(2);
    });

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
  });

  describe('4. Bad End & Validation Cases', () => {
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

    it('[BBG-VAL-01] Validation: Chặn StartGameSchema khi limit < 4 hoặc limit > 20 hoặc lessonId <= 0', () => {
      const parsed1 = StartGameSchema.safeParse({ query: { limit: 2 } });
      expect(parsed1.success).toBe(false);

      const parsed2 = StartGameSchema.safeParse({ query: { limit: 25 } });
      expect(parsed2.success).toBe(false);

      const parsed3 = StartGameSchema.safeParse({ query: { lessonId: -1 } });
      expect(parsed3.success).toBe(false);
    });

    it('[BBG-VAL-02] Validation: Chặn MatchPairSchema khi currentScore âm hoặc thiếu matchedPairs', () => {
      const parsed1 = MatchPairSchema.safeParse({
        body: { currentScore: -5, matchedPairs: 2, totalPairs: 4 },
      });
      expect(parsed1.success).toBe(false);

      const parsed2 = MatchPairSchema.safeParse({
        body: { currentScore: 10, totalPairs: 4 },
      });
      expect(parsed2.success).toBe(false);
    });

    it('[BBG-VAL-03] Validation: Chặn FinishGameSchema khi điểm số âm, duration âm hoặc totalPairs <= 0', () => {
      const parsed1 = FinishGameSchema.safeParse({
        body: { totalScore: -10, duration: 30, correctPairs: 4, totalPairs: 4 },
      });
      expect(parsed1.success).toBe(false);

      const parsed2 = FinishGameSchema.safeParse({
        body: { totalScore: 50, duration: -5, correctPairs: 4, totalPairs: 4 },
      });
      expect(parsed2.success).toBe(false);

      const parsed3 = FinishGameSchema.safeParse({
        body: { totalScore: 50, duration: 30, correctPairs: 4, totalPairs: 0 },
      });
      expect(parsed3.success).toBe(false);
    });

    it('[BBG-05] Mất kết nối DB khi lưu tiến trình ném lỗi', async () => {
      mockRepo.saveTemporaryProgress.mockRejectedValue(new Error('Connection lost (P1001)'));

      await expect(service.matchPair(1, mockMatchPairInput)).rejects.toThrow('Connection lost');
    });
  });
});
