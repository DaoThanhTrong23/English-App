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

    it('[STL-IT-LP-01] GET /api/student/courses/levels-progress trả về 200 kèm tiến độ', async () => {
      vi.spyOn(studentLessonService, 'getLevelsProgress').mockResolvedValue({
        user: { id: 1, username: 'test', cefrLevel: 'B1', xpPoints: 100 },
        groups: [{ id: 'A1-A2', name: 'Sơ cấp', isCompleted: false }] as any,
        levels: [{ level: 'A1', isCompleted: false }] as any,
      });

      const res = await request(app).get('/api/student/courses/levels-progress');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.groups.length).toBe(1);
    });

    it('[STL-IT-SAL-01] POST /api/student/courses/set-active-level đổi cấp độ thành công trả về 200', async () => {
      vi.spyOn(studentLessonService, 'setActiveLevel').mockResolvedValue({
        user: { id: 1, username: 'test', cefrLevel: 'B1', xpPoints: 100 },
        targetLevelGroup: 'B1-B2',
        message: 'Đã chuyển sang cấp độ học tập B1-B2 thành công!',
      });

      const res = await request(app)
        .post('/api/student/courses/set-active-level')
        .send({ level: 'B1-B2' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.targetLevelGroup).toBe('B1-B2');
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

    it('[STL-IT-SAL-02] POST /api/student/courses/set-active-level cấp độ không hợp lệ trả về 400', async () => {
      const { ApiError } = await import('../../../../shared/http/api-error.js');
      vi.spyOn(studentLessonService, 'setActiveLevel').mockRejectedValue(
        new ApiError(400, 'invalid_level', 'Cấp độ không hợp lệ')
      );

      const res = await request(app)
        .post('/api/student/courses/set-active-level')
        .send({ level: 'D1' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('invalid_level');
    });

    it('[STL-IT-IDOR-01] Chống IDOR: User A gửi ?userId=2 để lấy khóa học gợi ý của User B', async () => {
      const spy = vi.spyOn(studentLessonService, 'getCoursesList').mockResolvedValue({
        items: [],
        pagination: { currentPage: 1, limit: 10, totalItems: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false },
        streak: 5,
      });

      // User A (token có userId = 1) cố tình truyền userId = 2 vào query
      const res = await request(app).get('/api/student/courses?userId=2');

      expect(res.status).toBe(200);
      // Route phải bỏ qua query userId=2 và gọi service với userId = 1 từ session
      expect(spy).toHaveBeenCalledWith(1, expect.any(Object));
    });

    it('[STL-IT-IDOR-02] Chống IDOR: User A gửi payload chứa userId=2 để đổi cấp độ cho User B', async () => {
      const spy = vi.spyOn(studentLessonService, 'setActiveLevel').mockResolvedValue({
        user: { id: 1, cefrLevel: 'C1' } as any,
        targetLevelGroup: 'C1',
        message: 'Thành công',
      });

      const res = await request(app)
        .post('/api/student/courses/set-active-level')
        .send({ level: 'C1', userId: 2 });

      expect(res.status).toBe(200);
      // Service phải được gọi với userId = 1, không được thao tác lên User B
      expect(spy).toHaveBeenCalledWith(1, 'C1');
    });

    it('[STL-IT-IDOR-03] Chống IDOR: User A cố tình đăng ký khóa học cho User B', async () => {
      const spy = vi.spyOn(studentLessonService, 'enrollCourse').mockResolvedValue({
        courseId: 10,
        courseTitle: 'Topic 10',
        alreadyEnrolled: false,
        message: 'Đăng ký thành công',
      });

      const res = await request(app)
        .post('/api/student/courses/10/enroll')
        .send({ userId: 2 });

      expect(res.status).toBe(200);
      expect(spy).toHaveBeenCalledWith(1, 10);
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

    it('[STL-IT-SAL-03] 2 request đổi cấp độ song song qua API', async () => {
      vi.spyOn(studentLessonService, 'setActiveLevel')
        .mockResolvedValueOnce({
          user: { id: 1, cefrLevel: 'A2' } as any,
          targetLevelGroup: 'A2',
          message: 'Thành công',
        })
        .mockResolvedValueOnce({
          user: { id: 1, cefrLevel: 'B1' } as any,
          targetLevelGroup: 'B1',
          message: 'Thành công',
        });

      const [r1, r2] = await Promise.all([
        request(app).post('/api/student/courses/set-active-level').send({ level: 'A2' }),
        request(app).post('/api/student/courses/set-active-level').send({ level: 'B1' }),
      ]);

      expect(r1.status).toBe(200);
      expect(r2.status).toBe(200);
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

    it('[STL-IT-LP-02] Lỗi hệ thống khi lấy levels-progress trả về 500', async () => {
      vi.spyOn(studentLessonService, 'getLevelsProgress').mockRejectedValue(
        new Error('Database connection timeout')
      );

      const res = await request(app).get('/api/student/courses/levels-progress');

      expect(res.status).toBe(500);
    });

    it('[STL-IT-SAL-04] Lỗi hệ thống khi đổi active level trả về 500', async () => {
      vi.spyOn(studentLessonService, 'setActiveLevel').mockRejectedValue(
        new Error('Prisma write lock timeout')
      );

      const res = await request(app)
        .post('/api/student/courses/set-active-level')
        .send({ level: 'B2' });

      expect(res.status).toBe(500);
    });
  });
});
