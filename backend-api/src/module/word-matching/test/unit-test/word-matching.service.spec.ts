import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WordMatchingService } from '../../word-matching.service.js';
import {
  mockWordMatchingWords,
  mockSubmitWordMatchingInput,
  mockSaveWordMatchingProgressInput,
} from '../data-mock/word-matching.mock.js';

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

  describe('2. Bad End Cases', () => {
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
  });

  describe('3. Concurrency & Network Failures', () => {
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

    it('[WM-05] Mất kết nối database khi nộp bài ném lỗi', async () => {
      mockRepo.getWordsByIds.mockRejectedValue(new Error('Connection lost (P1001)'));

      await expect(service.submitAnswers(1, mockSubmitWordMatchingInput)).rejects.toThrow(
        'Connection lost'
      );
    });
  });
});
