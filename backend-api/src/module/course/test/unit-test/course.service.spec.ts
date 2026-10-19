import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CourseService } from '../../course.service.js';
import { mockCourseItem, mockCreateCourseInput } from '../data-mock/course.mock.js';
import { ApiError } from '../../../../shared/http/api-error.js';

describe('CourseService - Unit Tests (QC 10-Year Standard)', () => {
  let service: CourseService;
  let mockRepo: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepo = {
      findWithPagination: vi.fn(),
      findById: vi.fn(),
      countCourses: vi.fn(),
      checkWordsExist: vi.fn(),
      createCourse: vi.fn(),
      updateCourse: vi.fn(),
      softDelete: vi.fn(),
      restore: vi.fn(),
      addWordsToCourse: vi.fn(),
      removeWordFromCourse: vi.fn(),
      findLessonWord: vi.fn(),
    };
    service = new CourseService(mockRepo);
  });

  describe('1. Happy Cases', () => {
    it('[CRS-01a] Lấy danh sách bài học có phân trang', async () => {
      mockRepo.findWithPagination.mockResolvedValue({
        totalItems: 1,
        courses: [mockCourseItem],
      });

      const res = await service.getCoursesList({ page: 1, limit: 10 } as any);

      expect(res.items.length).toBe(1);
      expect(res.pagination.totalItems).toBe(1);
    });

    it('[CRS-01b] Tạo bài học mới và kiểm tra từ vựng tồn tại', async () => {
      mockRepo.checkWordsExist.mockResolvedValue([1, 2]);
      mockRepo.createCourse.mockResolvedValue({
        id: 2,
        ...mockCreateCourseInput,
        _count: { lessonWords: 2 },
        lessonWords: [
          { word: { id: 1, word: 'apple' } },
          { word: { id: 2, word: 'banana' } },
        ],
      });

      const res = await service.createCourse(mockCreateCourseInput as any);

      expect(res.id).toBe(2);
      expect(mockRepo.createCourse).toHaveBeenCalled();
    });

    it('[CRS-01c] Xóa mềm (soft-delete) bài học', async () => {
      mockRepo.findById.mockResolvedValue(mockCourseItem);
      mockRepo.softDelete.mockResolvedValue({ id: 1, deletedAt: new Date() });

      const res = await service.softDeleteCourse(1);

      expect(res.success).toBe(true);
      expect(mockRepo.softDelete).toHaveBeenCalledWith(1);
    });
  });

  describe('2. Bad End Cases', () => {
    it('[CRS-02] Tạo bài học với wordIds không tồn tại ném lỗi 400', async () => {
      mockRepo.checkWordsExist.mockResolvedValue([]);

      await expect(
        service.createCourse({ ...mockCreateCourseInput, wordIds: [9999] } as any)
      ).rejects.toThrowError(expect.objectContaining({ statuscode: 400, code: 'invalid_word_ids' }));
    });
  });

  describe('3. Concurrency Cases', () => {
    it('[CRS-03] Nhiều request xóa mềm và khôi phục song song', async () => {
      mockRepo.findById.mockResolvedValue({ ...mockCourseItem, deletedAt: new Date() });
      mockRepo.restore.mockResolvedValue(mockCourseItem);

      const res = await service.restoreCourse(1);
      expect(res.success).toBe(true);
    });
  });

  describe('4. Data Conflict & Network Failures', () => {
    it('[CRS-05] Mất kết nối DB khi tạo bài học ném lỗi hệ thống', async () => {
      mockRepo.checkWordsExist.mockResolvedValue([1, 2]);
      mockRepo.createCourse.mockRejectedValue(new Error('Connection lost (P1001)'));

      await expect(service.createCourse(mockCreateCourseInput as any)).rejects.toThrow('Connection lost');
    });
  });
});
