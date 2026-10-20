import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MarioGameService } from '../../mario-game.service.js';
import { mockMarioWords, mockMarioMatchPairInput, mockMarioFinishGameInput } from '../data-mock/mario-game.mock.js';
import { activityLogRepository } from '../../../activity-log/activity-log.repository.js';
import { StartGameSchema, MatchPairSchema, FinishGameSchema } from '../../mario-game.schema.js';

vi.mock('../../../activity-log/activity-log.repository.js', () => ({
  activityLogRepository: {
    createLog: vi.fn().mockResolvedValue({ id: 1 }),
  },
}));

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

  describe('2. Activity Logging Tests', () => {
    it('[MARIO-LOG-01] Ghi activity log thành công khi bắt đầu ván chơi Mario (USER_START_GAME_SUCCESS)', async () => {
      mockRepo.getWordsForGame.mockResolvedValue(mockMarioWords);

      await service.startGame(1, { limit: 4 });
      await new Promise((r) => setTimeout(r, 10));

      expect(activityLogRepository.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          actionType: 'USER_START_GAME_SUCCESS',
        })
      );
    });

    it('[MARIO-LOG-02] Ghi activity log thất bại khi không đủ từ vựng (USER_START_GAME_FAILED)', async () => {
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

    it('[MARIO-LOG-03] Ghi activity log thành công khi lưu tiến trình tạm (USER_SAVE_PROCESS_GAME_SUCCESS)', async () => {
      mockRepo.saveTemporaryProgress.mockResolvedValue(true);

      await service.matchPair(1, mockMarioMatchPairInput);
      await new Promise((r) => setTimeout(r, 10));

      expect(activityLogRepository.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          actionType: 'USER_SAVE_PROCESS_GAME_SUCCESS',
        })
      );
    });

    it('[MARIO-LOG-04] Ghi activity log thành công khi chốt điểm Mario game (USER_FINISH_GAME_SUCCESS)', async () => {
      mockRepo.finalizeGameResult.mockResolvedValue({
        score: 100,
        duration: 40,
        correctPairs: 4,
        totalPairs: 4,
        currentXp: 150,
      });

      await service.finishGame(1, mockMarioFinishGameInput);
      await new Promise((r) => setTimeout(r, 10));

      expect(activityLogRepository.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          actionType: 'USER_FINISH_GAME_SUCCESS',
        })
      );
    });

    it('[MARIO-LOG-05] Ghi activity log thất bại khi chốt điểm bị lỗi DB (USER_FINISH_GAME_FAILED)', async () => {
      mockRepo.finalizeGameResult.mockRejectedValue(new Error('Mario DB error'));

      await expect(service.finishGame(1, mockMarioFinishGameInput)).rejects.toThrow('Mario DB error');
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
    it('[MARIO-CONF-01] Đụng độ khi lưu tiến trình và chốt điểm Mario game diễn ra đồng thời', async () => {
      mockRepo.saveTemporaryProgress.mockResolvedValue(true);
      mockRepo.finalizeGameResult.mockResolvedValue({
        score: 100,
        duration: 40,
        correctPairs: 4,
        totalPairs: 4,
        currentXp: 150,
      });

      const [saveRes, finishRes] = await Promise.all([
        service.matchPair(1, mockMarioMatchPairInput),
        service.finishGame(1, mockMarioFinishGameInput),
      ]);

      expect(saveRes.message).toBe('Lưu tiến trình tạm thời thành công');
      expect(finishRes.result.totalScore).toBe(100);
    });

    it('[MARIO-CONF-02] Hai request chốt điểm đồng thời với dữ liệu khác nhau (chống replay attack/race condition)', async () => {
      mockRepo.finalizeGameResult
        .mockResolvedValueOnce({ score: 100, duration: 40, correctPairs: 4, totalPairs: 4, currentXp: 150 })
        .mockResolvedValueOnce({ score: 120, duration: 45, correctPairs: 5, totalPairs: 5, currentXp: 170 });

      const [res1, res2] = await Promise.all([
        service.finishGame(1, mockMarioFinishGameInput),
        service.finishGame(1, { ...mockMarioFinishGameInput, totalScore: 120 }),
      ]);

      expect(res1.result.totalScore).toBe(100);
      expect(res2.result.totalScore).toBe(120);
      expect(mockRepo.finalizeGameResult).toHaveBeenCalledTimes(2);
    });

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
  });

  describe('4. Bad End & Schema Validation Cases', () => {
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

    it('[MARIO-VAL-01] Validation: Chặn StartGameSchema khi limit < 4 hoặc > 20 hoặc lessonId <= 0', () => {
      const parsed1 = StartGameSchema.safeParse({ query: { limit: 3 } });
      expect(parsed1.success).toBe(false);

      const parsed2 = StartGameSchema.safeParse({ query: { limit: 25 } });
      expect(parsed2.success).toBe(false);

      const parsed3 = StartGameSchema.safeParse({ query: { lessonId: 0 } });
      expect(parsed3.success).toBe(false);
    });

    it('[MARIO-VAL-02] Validation: Chặn MatchPairSchema khi currentScore âm hoặc matchedPairs âm', () => {
      const parsed1 = MatchPairSchema.safeParse({
        body: { currentScore: -10, matchedPairs: 2, totalPairs: 4 },
      });
      expect(parsed1.success).toBe(false);

      const parsed2 = MatchPairSchema.safeParse({
        body: { currentScore: 50, matchedPairs: -1, totalPairs: 4 },
      });
      expect(parsed2.success).toBe(false);

      const parsed3 = MatchPairSchema.safeParse({
        body: { currentScore: 50, matchedPairs: 2, totalPairs: 0 },
      });
      expect(parsed3.success).toBe(false);
    });

    it('[MARIO-VAL-03] Validation: Chặn FinishGameSchema khi totalScore âm hoặc duration âm hoặc totalPairs <= 0', () => {
      const parsed1 = FinishGameSchema.safeParse({
        body: { totalScore: -50, duration: 40, correctPairs: 4, totalPairs: 4 },
      });
      expect(parsed1.success).toBe(false);

      const parsed2 = FinishGameSchema.safeParse({
        body: { totalScore: 100, duration: -10, correctPairs: 4, totalPairs: 4 },
      });
      expect(parsed2.success).toBe(false);

      const parsed3 = FinishGameSchema.safeParse({
        body: { totalScore: 100, duration: 40, correctPairs: 4, totalPairs: 0 },
      });
      expect(parsed3.success).toBe(false);
    });

    it('[MARIO-05] Mất kết nối DB khi lưu tiến trình ném lỗi', async () => {
      mockRepo.saveTemporaryProgress.mockRejectedValue(new Error('Connection lost (P1001)'));

      await expect(service.matchPair(1, mockMarioMatchPairInput)).rejects.toThrow('Connection lost');
    });
  });
});
