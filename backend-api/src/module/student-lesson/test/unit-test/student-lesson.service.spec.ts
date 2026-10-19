import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StudentLessonService } from '../../student-lesson.service.js';
import { mockCourse, mockLessonDetail } from '../data-mock/student-lesson.mock.js';
import { ApiError } from '../../../../shared/http/api-error.js';
import { prisma } from '../../../../config/prisma.js';

vi.mock('../../../../config/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    topic: {
      findUnique: vi.fn(),
    },
    test: {
      findMany: vi.fn(),
    },
    userTestResult: {
      findFirst: vi.fn(),
    },
    lessonWord: {
      findMany: vi.fn(),
    },
    userProgress: {
      findFirst: vi.fn(),
    },
    activityLog: {
      create: vi.fn().mockResolvedValue({ id: 1 }),
    },
  },
}));

vi.mock('../../keyword-setting/keyword-setting.service.js', () => ({
  keywordSettingService: {
    getSynonymDict: vi.fn().mockReturnValue({ 'du lịch': ['travel', 'hotel', 'flight'] }),
  },
}));

describe('StudentLessonService - Unit Tests (QC 10-Year Standard)', () => {
  let service: StudentLessonService;
  let mockRepo: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepo = {
      findCourses: vi.fn(),
      findCourseById: vi.fn(),
      findLessonsByCourseId: vi.fn(),
      findLessonDetailById: vi.fn(),
      hasCompletedLesson: vi.fn(),
      awardLessonXp: vi.fn(),
      calculateUserStreak: vi.fn(),
    };
    service = new StudentLessonService(mockRepo);
  });

  describe('1. Happy Cases', () => {
    it('[STL-01a] Hoàn thành bài học lần đầu được cộng +20 XP', async () => {
      mockRepo.findLessonDetailById.mockResolvedValue(mockLessonDetail);
      mockRepo.hasCompletedLesson.mockResolvedValue(false); // Chưa học bao giờ
      mockRepo.awardLessonXp.mockResolvedValue({ id: 1, xpPoints: 20 });

      const res = await service.completeLesson(1, 101);

      expect(res.firstTimeCompleted).toBe(true);
      expect(res.xpAwarded).toBe(20);
      expect(res.totalXp).toBe(20);
      expect(mockRepo.awardLessonXp).toHaveBeenCalledWith(1, 20);
    });

    it('[STL-01b] Đăng ký chủ đề học (enrollCourse) thành công', async () => {
      vi.mocked(prisma.topic.findUnique).mockResolvedValue(mockCourse as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 1,
        preferredTopics: '2,3',
      } as any);
      vi.mocked(prisma.test.findMany).mockResolvedValue([]);
      vi.mocked(prisma.lessonWord.findMany).mockResolvedValue([]);

      const res = await service.enrollCourse(1, 1);

      expect(res.courseId).toBe(1);
      expect(res.alreadyEnrolled).toBe(false);
      expect(prisma.user.update).toHaveBeenCalled();
    });
  });

  describe('2. Bad End Cases', () => {
    it('[STL-02a] Hoàn thành bài học không tồn tại ném lỗi 404', async () => {
      mockRepo.findLessonDetailById.mockResolvedValue(null);

      await expect(service.completeLesson(1, 9999)).rejects.toThrowError(
        expect.objectContaining({ statuscode: 404 })
      );
    });

    it('[STL-02b] Đăng ký chủ đề không tồn tại ném lỗi 404', async () => {
      vi.mocked(prisma.topic.findUnique).mockResolvedValue(null);

      await expect(service.enrollCourse(1, 9999)).rejects.toThrowError(
        expect.objectContaining({ statuscode: 404 })
      );
    });
  });

  describe('3. Concurrency & Farm XP Prevention', () => {
    it('[STL-03] Chống bug farm XP: Hoàn thành lại bài học đã học trước đó nhận +0 XP', async () => {
      mockRepo.findLessonDetailById.mockResolvedValue(mockLessonDetail);
      mockRepo.hasCompletedLesson.mockResolvedValue(true); // Đã học rồi!

      const res = await service.completeLesson(1, 101);

      expect(res.firstTimeCompleted).toBe(false);
      expect(res.xpAwarded).toBe(0);
      expect(mockRepo.awardLessonXp).not.toHaveBeenCalled();
    });
  });

  describe('4. Data Conflict & Network Failures', () => {
    it('[STL-05] Mất kết nối DB khi cộng XP ném lỗi máy chủ', async () => {
      mockRepo.findLessonDetailById.mockResolvedValue(mockLessonDetail);
      mockRepo.hasCompletedLesson.mockResolvedValue(false);
      mockRepo.awardLessonXp.mockRejectedValue(new Error('Connection terminated (P1001)'));

      await expect(service.completeLesson(1, 101)).rejects.toThrow('Connection terminated');
    });
  });
});
