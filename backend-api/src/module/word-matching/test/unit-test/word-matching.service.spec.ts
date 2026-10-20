import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WordMatchingService } from '../../word-matching.service.js';
import {
  mockWordMatchingWords,
  mockSubmitWordMatchingInput,
  mockSaveWordMatchingProgressInput,
} from '../data-mock/word-matching.mock.js';
import { activityLogRepository } from '../../../activity-log/activity-log.repository.js';
import {
  StartWordMatchingSchema,
  SubmitWordMatchingSchema,
  SaveWordMatchingProgressSchema,
} from '../../word-matching.schema.js';

vi.mock('../../../activity-log/activity-log.repository.js', () => ({
  activityLogRepository: {
    createLog: vi.fn().mockResolvedValue({ id: 1 }),
  },
}));

describe('WordMatchingService - Unit Tests (QC 10-Year Standard)', () => {
  let service: WordMatchingService;
  let mockRepo: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepo = {
      getWordsForGame: vi.fn(),
      getWordsByIds: vi.fn(),
      finalizeGameResult: vi.fn(),
      saveTemporaryProgress: vi.fn(),
    };
    service = new WordMatchingService(mockRepo);
  });

  describe('1. Happy Cases', () => {
    it('[WM-01a] Khởi tạo bàn chơi chia thành 2 cột A & B', async () => {
      mockRepo.getWordsForGame.mockResolvedValue(mockWordMatchingWords);

      const res = await service.startGame(1, { limit: 4, lessonId: 1 });

      expect(res.totalWords).toBe(4);
      expect(res.columnA).toHaveLength(4);
      expect(res.columnB).toHaveLength(4);
      expect(mockRepo.getWordsForGame).toHaveBeenCalledWith(1, 4, 1);
    });

    it('[WM-01b] Nộp bài và chấm điểm chính xác (2 đúng, 1 sai)', async () => {
      mockRepo.getWordsByIds.mockResolvedValue(mockWordMatchingWords);
      mockRepo.finalizeGameResult.mockResolvedValue({ currentXp: 120 });

      const res = await service.submitAnswers(1, mockSubmitWordMatchingInput);

      expect(res.totalQuestions).toBe(3);
      expect(res.correctCount).toBe(2);
      expect(res.wrongCount).toBe(1);
      expect(res.score).toBe(20);
      expect(res.details).toHaveLength(3);
      expect(mockRepo.finalizeGameResult).toHaveBeenCalledWith(1, 20, 3, 2);
    });

    it('[WM-01c] Lưu tiến trình nối từ tạm thời', async () => {
      mockRepo.saveTemporaryProgress.mockResolvedValue(true);

      const res = await service.saveProgress(1, mockSaveWordMatchingProgressInput);

      expect(res.message).toBe('Lưu tiến trình tạm thời thành công');
      expect(res.currentMatchedPairs).toBe(2);
      expect(mockRepo.saveTemporaryProgress).toHaveBeenCalled();
    });
  });

  describe('2. Activity Logging Tests', () => {
    it('[WM-LOG-01] Ghi activity log thành công khi bắt đầu ván nối từ (USER_START_WORD_MATCHING_SUCCESS)', async () => {
      mockRepo.getWordsForGame.mockResolvedValue(mockWordMatchingWords);

      await service.startGame(1, { limit: 4 });
      await new Promise((r) => setTimeout(r, 10));

      expect(activityLogRepository.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          actionType: 'USER_START_WORD_MATCHING_SUCCESS',
        })
      );
    });

    it('[WM-LOG-02] Ghi activity log thất bại khi không đủ từ vựng (USER_START_WORD_MATCHING_FAILED)', async () => {
      mockRepo.getWordsForGame.mockResolvedValue([]);

      await expect(service.startGame(1, { limit: 4 })).rejects.toThrow();
      await new Promise((r) => setTimeout(r, 10));

      expect(activityLogRepository.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          actionType: 'USER_START_WORD_MATCHING_FAILED',
        })
      );
    });

    it('[WM-LOG-03] Ghi activity log thành công khi nộp bài nối từ (USER_SUBMIT_WORD_MATCHING_SUCCESS)', async () => {
      mockRepo.getWordsByIds.mockResolvedValue(mockWordMatchingWords);
      mockRepo.finalizeGameResult.mockResolvedValue({ currentXp: 120 });

      await service.submitAnswers(1, mockSubmitWordMatchingInput);
      await new Promise((r) => setTimeout(r, 10));

      expect(activityLogRepository.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          actionType: 'USER_SUBMIT_WORD_MATCHING_SUCCESS',
        })
      );
    });

    it('[WM-LOG-04] Ghi activity log thành công khi lưu tiến trình nối từ tạm thời (USER_SAVE_WORD_MATCHING_PROGRESS_SUCCESS)', async () => {
      mockRepo.saveTemporaryProgress.mockResolvedValue(true);

      await service.saveProgress(1, mockSaveWordMatchingProgressInput);
      await new Promise((r) => setTimeout(r, 10));

      expect(activityLogRepository.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          actionType: 'USER_SAVE_WORD_MATCHING_PROGRESS_SUCCESS',
        })
      );
    });

    it('[WM-LOG-05] Ghi activity log thất bại khi nộp bài bị lỗi CSDL (USER_SUBMIT_WORD_MATCHING_FAILED)', async () => {
      mockRepo.getWordsByIds.mockRejectedValue(new Error('WM DB error'));

      await expect(service.submitAnswers(1, mockSubmitWordMatchingInput)).rejects.toThrow('WM DB error');
      await new Promise((r) => setTimeout(r, 10));

      expect(activityLogRepository.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          actionType: 'USER_SUBMIT_WORD_MATCHING_FAILED',
        })
      );
    });
  });

  describe('3. Concurrency & Conflict Tests', () => {
    it('[WM-CONF-01] Đụng độ khi đang lưu tiến trình tạm thì request submit nộp bài gửi tới đồng thời', async () => {
      mockRepo.saveTemporaryProgress.mockResolvedValue(true);
      mockRepo.getWordsByIds.mockResolvedValue(mockWordMatchingWords);
      mockRepo.finalizeGameResult.mockResolvedValue({ currentXp: 120 });

      const [saveRes, submitRes] = await Promise.all([
        service.saveProgress(1, mockSaveWordMatchingProgressInput),
        service.submitAnswers(1, mockSubmitWordMatchingInput),
      ]);

      expect(saveRes.message).toBe('Lưu tiến trình tạm thời thành công');
      expect(submitRes.score).toBe(20);
    });

    it('[WM-CONF-02] Hai request nộp bài submit gửi đồng thời với các đáp án khác nhau', async () => {
      mockRepo.getWordsByIds.mockResolvedValue(mockWordMatchingWords);
      mockRepo.finalizeGameResult
        .mockResolvedValueOnce({ currentXp: 120 })
        .mockResolvedValueOnce({ currentXp: 130 });

      const [res1, res2] = await Promise.all([
        service.submitAnswers(1, mockSubmitWordMatchingInput),
        service.submitAnswers(1, { ...mockSubmitWordMatchingInput, duration: 60 }),
      ]);

      expect(res1.score).toBe(20);
      expect(res2.score).toBe(20);
      expect(mockRepo.finalizeGameResult).toHaveBeenCalledTimes(2);
    });

    it('[WM-03] Hai yêu cầu nộp bài submit song song', async () => {
      mockRepo.getWordsByIds.mockResolvedValue(mockWordMatchingWords);
      mockRepo.finalizeGameResult
        .mockResolvedValueOnce({ currentXp: 120 })
        .mockResolvedValueOnce({ currentXp: 140 });

      const [res1, res2] = await Promise.all([
        service.submitAnswers(1, mockSubmitWordMatchingInput),
        service.submitAnswers(1, mockSubmitWordMatchingInput),
      ]);

      expect(res1.score).toBe(20);
      expect(res2.score).toBe(20);
    });
  });

  describe('4. Bad End & Schema Validation Cases', () => {
    it('[WM-02a] Bắt đầu ván chơi khi thiếu từ vựng (< 4 từ) ném lỗi 400', async () => {
      mockRepo.getWordsForGame.mockResolvedValue(mockWordMatchingWords.slice(0, 2));

      await expect(service.startGame(1, { limit: 4 })).rejects.toThrowError(
        expect.objectContaining({ statuscode: 400, code: 'not_enough_words' })
      );
    });

    it('[WM-02b] Bắt đầu ván chơi khi DB không có từ nào ném 400', async () => {
      mockRepo.getWordsForGame.mockResolvedValue([]);

      await expect(service.startGame(1, { limit: 4 })).rejects.toThrowError(
        expect.objectContaining({ statuscode: 400, code: 'not_enough_words' })
      );
    });

    it('[WM-VAL-01] Validation: Chặn StartWordMatchingSchema khi limit < 4 hoặc > 20 hoặc lessonId <= 0', () => {
      const parsed1 = StartWordMatchingSchema.safeParse({ query: { limit: 2 } });
      expect(parsed1.success).toBe(false);

      const parsed2 = StartWordMatchingSchema.safeParse({ query: { limit: 25 } });
      expect(parsed2.success).toBe(false);

      const parsed3 = StartWordMatchingSchema.safeParse({ query: { lessonId: 0 } });
      expect(parsed3.success).toBe(false);
    });

    it('[WM-VAL-02] Validation: Chặn SubmitWordMatchingSchema khi duration âm hoặc answers rỗng []', () => {
      const parsed1 = SubmitWordMatchingSchema.safeParse({
        body: { duration: -5, answers: [{ wordId: 1, selectedMeaningId: 1 }] },
      });
      expect(parsed1.success).toBe(false);

      const parsed2 = SubmitWordMatchingSchema.safeParse({
        body: { duration: 30, answers: [] },
      });
      expect(parsed2.success).toBe(false);
    });

    it('[WM-VAL-03] Validation: Chặn SaveWordMatchingProgressSchema khi currentMatchedPairs âm hoặc totalPairs < 1', () => {
      const parsed1 = SaveWordMatchingProgressSchema.safeParse({
        body: { currentMatchedPairs: -1, totalPairs: 10 },
      });
      expect(parsed1.success).toBe(false);

      const parsed2 = SaveWordMatchingProgressSchema.safeParse({
        body: { currentMatchedPairs: 2, totalPairs: 0 },
      });
      expect(parsed2.success).toBe(false);
    });

    it('[WM-05] Mất kết nối database khi nộp bài ném lỗi', async () => {
      mockRepo.getWordsByIds.mockRejectedValue(new Error('Connection lost (P1001)'));

      await expect(service.submitAnswers(1, mockSubmitWordMatchingInput)).rejects.toThrow(
        'Connection lost'
      );
    });
  });
});
