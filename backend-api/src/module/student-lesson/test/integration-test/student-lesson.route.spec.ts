import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { studentCourseRouter, studentLessonRouter } from '../../student-lesson.route.js';
import { errorHandler } from '../../../../shared/http/error-handler.js';
import { studentLessonService } from '../../student-lesson.service.js';

vi.mock('../../../../middleware/authenticate.middleware.js', () => ({
  Authenticate: (req: any, _res: any, next: any) => {
    req.user = { userId: 1, role: 'user' };
    next();
  },
}));

describe('Student Lesson & Course Routes - Integration Tests (QC 10-Year Standard)', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/student/courses', studentCourseRouter);
    app.use('/api/student/lessons', studentLessonRouter);
    app.use(errorHandler);
  });

  describe('1. Happy Cases', () => {
    it('[STL-IT-01] GET /api/student/courses trả về 200 kèm danh sách khóa học', async () => {
      vi.spyOn(studentLessonService, 'getCoursesList').mockResolvedValue({
        courses: [{ id: 1, title: 'English for IT' } as any],
        pagination: { currentPage: 1, limit: 10, totalItems: 1, totalPages: 1, hasNextPage: false, hasPrevPage: false },
      } as any);

      const res = await request(app).get('/api/student/courses');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.courses.length).toBe(1);
    });

    it('[STL-IT-02] POST /api/student/lessons/:id/complete hoàn thành bài học và nhận XP', async () => {
      vi.spyOn(studentLessonService, 'completeLesson').mockResolvedValue({
        lessonId: 101,
        lessonTitle: 'Lesson 1',
        isCompleted: true,
        firstTimeCompleted: true,
        xpAwarded: 20,
        totalXp: 120,
        message: 'Chúc mừng bạn đã hoàn tất bài học và nhận được +20 XP!',
      });

      const res = await request(app).post('/api/student/lessons/101/complete');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.xpAwarded).toBe(20);
    });
  });

  describe('2. Bad End Cases', () => {
    it('[STL-IT-03] GET /api/student/lessons/abc truyền param không phải số trả về 422', async () => {
      const res = await request(app).get('/api/student/lessons/abc');

      expect(res.status).toBe(422);
    });

    it('[STL-IT-04] POST /api/student/lessons/999/complete không tìm thấy bài học trả về 404', async () => {
      const { ApiError } = await import('../../../../shared/http/api-error.js');
      vi.spyOn(studentLessonService, 'completeLesson').mockRejectedValue(
        new ApiError(404, 'lesson_not_found', 'Không tìm thấy bài học')
      );

      const res = await request(app).post('/api/student/lessons/999/complete');

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('lesson_not_found');
    });
  });

  describe('3. Concurrency Cases', () => {
    it('[STL-IT-05] 2 request hoàn thành bài học đồng thời', async () => {
      vi.spyOn(studentLessonService, 'completeLesson')
        .mockResolvedValueOnce({
          lessonId: 101,
          isCompleted: true,
          firstTimeCompleted: true,
          xpAwarded: 20,
        } as any)
        .mockResolvedValueOnce({
          lessonId: 101,
          isCompleted: true,
          firstTimeCompleted: false,
          xpAwarded: 0,
        } as any);

      const [r1, r2] = await Promise.all([
        request(app).post('/api/student/lessons/101/complete'),
        request(app).post('/api/student/lessons/101/complete'),
      ]);

      expect(r1.status).toBe(200);
      expect(r2.status).toBe(200);
      expect(r1.body.data.xpAwarded).toBe(20);
      expect(r2.body.data.xpAwarded).toBe(0);
    });
  });

  describe('4. Data Conflict & Network Failures', () => {
    it('[STL-IT-06] Lỗi kết nối DB trả về 500 lỗi máy chủ', async () => {
      vi.spyOn(studentLessonService, 'completeLesson').mockRejectedValue(
        new Error('Database unavailable (P1001)')
      );

      const res = await request(app).post('/api/student/lessons/101/complete');

      expect(res.status).toBe(500);
    });
  });
});
