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
      findMany: vi.fn(),
    },
    test: {
      findMany: vi.fn(),
    },
    userTestResult: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
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

    it('[STL-PER-01] getCoursesList tính điểm cá nhân hóa chính xác theo trình độ và sở thích của từng học viên', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 1,
        username: 'learner1',
        cefrLevel: 'B1',
        interests: 'du lịch',
        preferredTopics: '1',
      } as any);

      vi.mocked(prisma.userTestResult.findMany).mockResolvedValue([]);

      mockRepo.findCourses.mockResolvedValue({
        courses: [
          { id: 1, title: 'English for Travel', cefrLevel: 'B1', description: 'learn travel vocab', lessons: [] },
          { id: 2, title: 'Medical English', cefrLevel: 'C2', description: 'surgery and medicine', lessons: [] },
        ],
        total: 2,
      });

      const res = await service.getCoursesList(1, { page: 1, limit: 10 });

      expect(res.items.length).toBe(2);
      // Khóa học id 1 đã đăng ký và khớp sở thích/trình độ phải xếp trước
      expect(res.items[0].id).toBe(1);
      expect(res.items[0].isEnrolled).toBe(true);
      expect(res.items[0].personalizedScore).toBeGreaterThan(res.items[1].personalizedScore);
    });

    it('[STL-LP-01] getLevelsProgress trả về đúng cấu trúc nhóm và 6 cấp độ CEFR', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 1,
        username: 'student1',
        cefrLevel: 'B1',
        xpPoints: 300,
      } as any);

      vi.mocked(prisma.topic.findMany).mockResolvedValue([
        {
          id: 1,
          title: 'Topic A1',
          cefrLevel: 'A1',
          lessons: [
            {
              id: 10,
              lessonWords: [{ wordId: 101 }, { wordId: 102 }],
              tests: [{ id: 501 }],
            },
          ],
        },
      ] as any);

      vi.mocked(prisma.userTestResult.findMany).mockResolvedValue([
        { testId: 501 } as any,
      ]);

      const res = await service.getLevelsProgress(1);

      expect(res.user.id).toBe(1);
      expect(res.user.cefrLevel).toBe('B1');
      expect(res.groups.length).toBe(3); // A1-A2, B1-B2, C1-C2
      expect(res.levels.length).toBe(6); // A1, A2, B1, B2, C1, C2

      const groupA = res.groups.find(g => g.id === 'A1-A2');
      expect(groupA).toBeDefined();
      expect(groupA?.totalLessons).toBe(1);
      expect(groupA?.completedLessons).toBe(1);
      expect(groupA?.progressPercentage).toBe(100);
      expect(groupA?.isCompleted).toBe(true);
      expect(groupA?.certificate).not.toBeNull();
      expect(groupA?.certificate?.recipientName).toBe('student1');
    });

    it('[STL-SAL-01] setActiveLevel với cấp độ hợp lệ (B2) cập nhật thành công', async () => {
      vi.mocked(prisma.user.update).mockResolvedValue({
        id: 1,
        username: 'student1',
        cefrLevel: 'B2',
        xpPoints: 300,
      } as any);

      const res = await service.setActiveLevel(1, 'B2');

      expect(res.targetLevelGroup).toBe('B2');
      expect(res.user.cefrLevel).toBe('B2');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: { cefrLevel: 'B2' },
        })
      );
    });

    it('[STL-SAL-02] setActiveLevel với nhóm cấp độ (A1-A2) phân tách thành base cefrLevel A1', async () => {
      vi.mocked(prisma.user.update).mockResolvedValue({
        id: 1,
        username: 'student1',
        cefrLevel: 'A1',
        xpPoints: 300,
      } as any);

      const res = await service.setActiveLevel(1, 'A1-A2');

      expect(res.targetLevelGroup).toBe('A1-A2');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: { cefrLevel: 'A1' },
        })
      );
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

    it('[STL-SAL-03] setActiveLevel với level không hợp lệ ném lỗi 400 invalid_level', async () => {
      await expect(service.setActiveLevel(1, 'D1')).rejects.toThrowError(
        expect.objectContaining({ statuscode: 400, code: 'invalid_level' })
      );
    });

    it('[STL-SAL-04] setActiveLevel với chuỗi rỗng hoặc giá trị bất hợp pháp ném lỗi 400', async () => {
      await expect(service.setActiveLevel(1, '')).rejects.toThrowError(
        expect.objectContaining({ statuscode: 400, code: 'invalid_level' })
      );
      await expect(service.setActiveLevel(1, 'A3')).rejects.toThrowError(
        expect.objectContaining({ statuscode: 400, code: 'invalid_level' })
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

    it('[STL-SAL-CON-01] 2 request đổi cấp độ song song không gây xung đột dữ liệu', async () => {
      vi.mocked(prisma.user.update)
        .mockResolvedValueOnce({ id: 1, username: 'student1', cefrLevel: 'B1', xpPoints: 100 } as any)
        .mockResolvedValueOnce({ id: 1, username: 'student1', cefrLevel: 'B2', xpPoints: 100 } as any);

      const [r1, r2] = await Promise.all([
        service.setActiveLevel(1, 'B1'),
        service.setActiveLevel(1, 'B2'),
      ]);

      expect(r1.targetLevelGroup).toBe('B1');
      expect(r2.targetLevelGroup).toBe('B2');
      expect(prisma.user.update).toHaveBeenCalledTimes(2);
    });
  });

  describe('4. Data Conflict & Network Failures', () => {
    it('[STL-05] Mất kết nối DB khi cộng XP ném lỗi máy chủ', async () => {
      mockRepo.findLessonDetailById.mockResolvedValue(mockLessonDetail);
      mockRepo.hasCompletedLesson.mockResolvedValue(false);
      mockRepo.awardLessonXp.mockRejectedValue(new Error('Connection terminated (P1001)'));

      await expect(service.completeLesson(1, 101)).rejects.toThrow('Connection terminated');
    });

    it('[STL-LP-NET-01] Lỗi DB findMany khi tính levels-progress ném lỗi', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 1, username: 'user1' } as any);
      vi.mocked(prisma.topic.findMany).mockRejectedValue(new Error('PrismaClientKnownRequestError'));

      await expect(service.getLevelsProgress(1)).rejects.toThrow('PrismaClientKnownRequestError');
    });

    it('[STL-SAL-NET-01] Lỗi DB update khi setActiveLevel ném lỗi', async () => {
      vi.mocked(prisma.user.update).mockRejectedValue(new Error('Connection lost'));

      await expect(service.setActiveLevel(1, 'C1')).rejects.toThrow('Connection lost');
    });
  });
});
