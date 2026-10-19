import { describe, it, expect, vi, beforeEach } from 'vitest';
import { wordService } from '../../word.service.js';
import { wordRepository } from '../../word.repository.js';
import { mockWordItem, mockCreateWordInput } from '../data-mock/word.mock.js';
import { ApiError } from '../../../../shared/http/api-error.js';

vi.mock('../../word.repository.js', () => ({
  wordRepository: {
    getWords: vi.fn(),
    findExactWord: vi.fn(),
    createWord: vi.fn(),
    createBulkWords: vi.fn(),
    updateWord: vi.fn(),
    deleteWord: vi.fn(),
    countWord: vi.fn(),
  },
}));

describe('WordService - Unit Tests (QC 10-Year Standard)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Happy Cases', () => {
    it('[WRD-01a] Lấy danh sách từ vựng có phân trang và bộ lọc', async () => {
      vi.mocked(wordRepository.getWords).mockResolvedValue({
        words: [mockWordItem as any],
        total: 1,
      });

      const res = await wordService.fetchWords(1, 10, 'B2', 'innovate');

      expect(res.data.length).toBe(1);
      expect(res.meta.totalItems).toBe(1);
    });

    it('[WRD-01b] Thêm từ vựng mới thành công', async () => {
      vi.mocked(wordRepository.findExactWord).mockResolvedValue(null);
      vi.mocked(wordRepository.createWord).mockResolvedValue({ id: 2, ...mockCreateWordInput } as any);

      const res = await wordService.createWord(mockCreateWordInput as any);

      expect(res.id).toBe(2);
      expect(wordRepository.createWord).toHaveBeenCalled();
    });
  });

  describe('2. Bad End & Duplicate Cases', () => {
    it('[WRD-02] Trùng từ và loại từ (headword + partOfSpeech) ném lỗi 400 word_exists', async () => {
      vi.mocked(wordRepository.findExactWord).mockResolvedValue(mockWordItem as any);

      await expect(
        wordService.createWord({ headword: 'innovate', partOfSpeech: 'verb' } as any)
      ).rejects.toThrowError(expect.objectContaining({ statuscode: 400, code: 'word_exists' }));
    });
  });

  describe('3. Concurrency Cases', () => {
    it('[WRD-03] Nhiều Admin cập nhật từ vựng song song', async () => {
      vi.mocked(wordRepository.findExactWord).mockResolvedValue(null);
      vi.mocked(wordRepository.updateWord).mockResolvedValue(mockWordItem as any);

      const p1 = wordService.updateWord('1', { meaning: 'Meaning 1' });
      const p2 = wordService.updateWord('2', { meaning: 'Meaning 2' });

      await Promise.all([p1, p2]);
      expect(wordRepository.updateWord).toHaveBeenCalledTimes(2);
    });
  });

  describe('4. Data Conflict & Network Failures', () => {
    it('[WRD-05] Mất kết nối DB khi xóa từ ném lỗi hệ thống', async () => {
      vi.mocked(wordRepository.deleteWord).mockRejectedValue(new Error('Connection lost (P1001)'));

      await expect(wordService.deleteWord('1')).rejects.toThrow('Connection lost');
    });
  });
});
