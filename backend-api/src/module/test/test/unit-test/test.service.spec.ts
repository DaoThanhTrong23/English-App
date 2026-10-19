import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestService } from '../../test.service.js';
import {
  mockTestItem,
  mockQuestionItem,
  mockCreateTestInput,
  mockCreateQuestionInput,
} from '../data-mock/test.mock.js';
import { ApiError } from '../../../../shared/http/api-error.js';

describe('TestService - Unit Tests (QC 10-Year Standard)', () => {
  let service: TestService;
  let mockRepo: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepo = {
      findTests: vi.fn(),
      findTestById: vi.fn(),
      createTest: vi.fn(),
      updateTest: vi.fn(),
      deleteTest: vi.fn(),
      findQuestionsByTestId: vi.fn(),
      createQuestionWithAnswers: vi.fn(),
      updateQuestionWithAnswers: vi.fn(),
      deleteQuestion: vi.fn(),
      getTestResults: vi.fn(),
      createManyQuestions: vi.fn(),
    };
    service = new TestService(mockRepo);
  });

  describe('1. Happy Cases', () => {
    it('[TST-01a] Lấy danh sách bài thi thành công theo level & search', async () => {
      mockRepo.findTests.mockResolvedValue([mockTestItem]);

      const res = await service.getAllTests('B1', 'Kiểm tra', 10);

      expect(res).toHaveLength(1);
      expect(res[0].id).toBe(1);
      expect(mockRepo.findTests).toHaveBeenCalledWith('B1', 'Kiểm tra', 10);
    });

    it('[TST-01b] Tạo bài thi mới thành công', async () => {
      mockRepo.createTest.mockResolvedValue({ id: 2, ...mockCreateTestInput });

      const res = await service.createTest(mockCreateTestInput);

      expect(res.id).toBe(2);
      expect(mockRepo.createTest).toHaveBeenCalledWith(mockCreateTestInput);
    });

    it('[TST-01c] Thêm câu hỏi và đáp án vào bài thi', async () => {
      mockRepo.findTestById.mockResolvedValue(mockTestItem);
      mockRepo.createQuestionWithAnswers.mockResolvedValue({
        id: 10,
        testId: 1,
        ...mockCreateQuestionInput,
      });

      const res = await service.addQuestion(1, mockCreateQuestionInput);

      expect(res.id).toBe(10);
      expect(mockRepo.createQuestionWithAnswers).toHaveBeenCalledWith(
        1,
        mockCreateQuestionInput,
        mockCreateQuestionInput.answers
      );
    });

    it('[TST-01d] Xóa bài thi thành công', async () => {
      mockRepo.findTestById.mockResolvedValue(mockTestItem);
      mockRepo.deleteTest.mockResolvedValue(mockTestItem);

      const res = await service.deleteTest(1);

      expect(res).toEqual(mockTestItem);
      expect(mockRepo.deleteTest).toHaveBeenCalledWith(1);
    });
  });

  describe('2. Bad End Cases', () => {
    it('[TST-02a] Update bài thi không tồn tại ném lỗi 404', async () => {
      mockRepo.findTestById.mockResolvedValue(null);

      await expect(service.updateTest(999, { title: 'New Title' })).rejects.toThrowError(
        expect.objectContaining({ statuscode: 404, code: 'not_found' })
      );
    });

    it('[TST-02b] Thêm câu hỏi vào bài thi không tồn tại ném lỗi 404', async () => {
      mockRepo.findTestById.mockResolvedValue(null);

      await expect(service.addQuestion(999, mockCreateQuestionInput)).rejects.toThrowError(
        expect.objectContaining({ statuscode: 404, code: 'not_found' })
      );
    });

    it('[TST-02c] Lấy danh sách câu hỏi của bài thi không tồn tại ném lỗi 404', async () => {
      mockRepo.findTestById.mockResolvedValue(null);

      await expect(service.getQuestions(999)).rejects.toThrowError(
        expect.objectContaining({ statuscode: 404, code: 'not_found' })
      );
    });
  });

  describe('3. Concurrency & Race Cases', () => {
    it('[TST-03] Hai yêu cầu xóa bài thi cùng lúc xử lý an toàn', async () => {
      mockRepo.findTestById
        .mockResolvedValueOnce(mockTestItem)
        .mockResolvedValueOnce(null);
      mockRepo.deleteTest.mockResolvedValue(mockTestItem);

      const firstCall = service.deleteTest(1);
      const secondCall = service.deleteTest(1);

      await expect(firstCall).resolves.toEqual(mockTestItem);
      await expect(secondCall).rejects.toThrowError(
        expect.objectContaining({ statuscode: 404 })
      );
    });
  });

  describe('4. Data Conflict & Network Failures', () => {
    it('[TST-05a] Mất kết nối DB khi lấy danh sách câu hỏi ném lỗi hệ thống', async () => {
      mockRepo.findTestById.mockRejectedValue(new Error('Connection lost (P1001)'));

      await expect(service.getQuestions(1)).rejects.toThrow('Connection lost');
    });

    it('[TST-05b] Lỗi Rollback transaction khi lưu câu hỏi và đáp án ném lỗi', async () => {
      mockRepo.findTestById.mockResolvedValue(mockTestItem);
      mockRepo.createQuestionWithAnswers.mockRejectedValue(
        new Error('Transaction rollback: Foreign key constraint failed')
      );

      await expect(service.addQuestion(1, mockCreateQuestionInput)).rejects.toThrow(
        'Transaction rollback'
      );
    });
  });
});
