import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { courseRouter } from '../../course.route.js';
import { errorHandler } from '../../../../shared/http/error-handler.js';
import { courseService } from '../../course.service.js';

vi.mock('../../../../middleware/authenticate.middleware.js', () => ({
  Authenticate: (req: any, _res: any, next: any) => {
    req.user = { userId: 1, role: 'admin' };
    next();
  },
}));

vi.mock('../../../../middleware/authorize.middleware.js', () => ({
  authorize: () => (_req: any, _res: any, next: any) => next(),
}));

describe('Course Routes - Integration Tests (QC 10-Year Standard)', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/admin/courses', courseRouter);
    app.use(errorHandler);
  });

  describe('1. Happy Cases', () => {
    it('[CRS-IT-01] GET /api/admin/courses trả về danh sách bài học', async () => {
      vi.spyOn(courseService, 'getCoursesList').mockResolvedValue({
        items: [{ id: 1, title: 'Bài 1' } as any],
        pagination: { currentPage: 1, limit: 10, totalItems: 1, totalPages: 1, hasNextPage: false, hasPrevPage: false },
      });

      const res = await request(app).get('/api/admin/courses?page=1&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBe(1);
    });

    it('[CRS-IT-02] DELETE /api/admin/courses/:id xóa mềm bài học', async () => {
      vi.spyOn(courseService, 'softDeleteCourse').mockResolvedValue({ success: true, message: 'Xóa mềm khóa học thành công' } as any);

      const res = await request(app).delete('/api/admin/courses/1');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('2. Bad End Cases', () => {
    it('[CRS-IT-03] DELETE /api/admin/courses/abc id không phải số trả về 422', async () => {
      const res = await request(app).delete('/api/admin/courses/abc');

      expect(res.status).toBe(422);
    });
  });

  describe('3. Network Failures', () => {
    it('[CRS-IT-04] Mất kết nối DB khi lấy danh sách trả về 500', async () => {
      vi.spyOn(courseService, 'getCoursesList').mockRejectedValue(new Error('Connection lost (P1001)'));

      const res = await request(app).get('/api/admin/courses?page=1&limit=10');

      expect(res.status).toBe(500);
    });
  });
});
