import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TopicService } from '../../topic.service.js';
import { mockTopicItem, mockCreateTopicInput } from '../data-mock/topic.mock.js';
import { ApiError } from '../../../../shared/http/api-error.js';

describe('TopicService - Unit Tests (QC 10-Year Standard)', () => {
  let service: TopicService;
  let mockRepo: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepo = {
      findAll: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    service = new TopicService(mockRepo);
  });

  describe('1. Happy Cases', () => {
    it('[TOP-01a] Lấy danh sách toàn bộ chủ đề', async () => {
      mockRepo.findAll.mockResolvedValue([mockTopicItem]);

      const res = await service.getAllTopics();

      expect(res.length).toBe(1);
      expect(res[0].title).toBe('Giao tiếp cơ bản');
    });

    it('[TOP-01b] Tạo chủ đề mới thành công', async () => {
      mockRepo.create.mockResolvedValue({ id: 2, ...mockCreateTopicInput });

      const res = await service.createTopic(mockCreateTopicInput);

      expect(res.id).toBe(2);
      expect(res.title).toBe(mockCreateTopicInput.title);
    });

    it('[TOP-01c] Xóa chủ đề thành công', async () => {
      mockRepo.findById.mockResolvedValue(mockTopicItem);
      mockRepo.delete.mockResolvedValue({ id: 1 });

      const res = await service.deleteTopic(1);

      expect(res.id).toBe(1);
    });
  });

  describe('2. Bad End Cases', () => {
    it('[TOP-02] Tìm/sửa/xóa chủ đề không tồn tại ném lỗi 404', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.getTopicById(9999)).rejects.toThrowError(
        expect.objectContaining({ statuscode: 404 })
      );
      await expect(service.updateTopic(9999, {})).rejects.toThrowError(
        expect.objectContaining({ statuscode: 404 })
      );
      await expect(service.deleteTopic(9999)).rejects.toThrowError(
        expect.objectContaining({ statuscode: 404 })
      );
    });
  });

  describe('3. Concurrency Cases', () => {
    it('[TOP-03] Nhiều request sửa topic đồng thời', async () => {
      mockRepo.findById.mockResolvedValue(mockTopicItem);
      mockRepo.update.mockResolvedValue(mockTopicItem);

      const p1 = service.updateTopic(1, { title: 'T1' });
      const p2 = service.updateTopic(1, { title: 'T2' });

      await Promise.all([p1, p2]);
      expect(mockRepo.update).toHaveBeenCalledTimes(2);
    });
  });

  describe('4. Data Conflict & Network Failures', () => {
    it('[TOP-05] Mất kết nối DB khi xóa topic ném lỗi hệ thống', async () => {
      mockRepo.findById.mockResolvedValue(mockTopicItem);
      mockRepo.delete.mockRejectedValue(new Error('Connection lost (P1001)'));

      await expect(service.deleteTopic(1)).rejects.toThrow('Connection lost');
    });
  });
});
