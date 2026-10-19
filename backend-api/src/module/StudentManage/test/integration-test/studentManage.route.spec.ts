import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { studentManageRouter } from '../../studenManage.route.js';
import { errorHandler } from '../../../../shared/http/error-handler.js';
import { studentManageService } from '../../studentManage.service.js';

vi.mock('../../../../middleware/authenticate.middleware.js', () => ({
  Authenticate: (req: any, _res: any, next: any) => {
    req.user = { userId: 1, role: 'admin' };
    next();
  },
}));

vi.mock('../../../../middleware/authorize.middleware.js', () => ({
  authorize: () => (_req: any, _res: any, next: any) => next(),
}));

describe('StudentManage Routes - Integration Tests (QC 10-Year Standard)', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/admin/students', studentManageRouter);
    app.use(errorHandler);
  });

  describe('1. Happy Cases', () => {
    it('[STM-IT-01] GET /api/admin/students trả về danh sách học viên', async () => {
      vi.spyOn(studentManageService, 'getStudentslist').mockResolvedValue({
        items: [{ id: 10, username: 'student10' } as any],
        pagination: { currentPage: 1, limit: 10, totalItems: 1, totalPages: 1, hasNextPage: false, hasPrevPage: false },
      });

      const res = await request(app).get('/api/admin/students?page=1&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBe(1);
    });

    it('[STM-IT-02] PATCH /api/admin/students/:id/status cập nhật trạng thái khóa tài khoản', async () => {
      vi.spyOn(studentManageService, 'updateStudentLockStatus').mockResolvedValue({
        id: 10,
        username: 'student10',
        email: 'student10@example.com',
        isLocked: true,
      });

      const res = await request(app)
        .patch('/api/admin/students/10/status')
        .send({ isLocked: true });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Đã khóa tài khoản');
    });
  });

  describe('2. Bad End Cases', () => {
    it('[STM-IT-03] PATCH /api/admin/students/:id/status thiếu isLocked trả về 422', async () => {
      const res = await request(app)
        .patch('/api/admin/students/10/status')
        .send({});

      expect(res.status).toBe(422);
    });
  });

  describe('3. Concurrency Cases', () => {
    it('[STM-IT-04] Gửi 2 request thay đổi trạng thái khóa học viên đồng thời', async () => {
      vi.spyOn(studentManageService, 'updateStudentLockStatus').mockResolvedValue({ id: 10, isLocked: false } as any);

      const [r1, r2] = await Promise.all([
        request(app).patch('/api/admin/students/10/status').send({ isLocked: false }),
        request(app).patch('/api/admin/students/10/status').send({ isLocked: false }),
      ]);

      expect(r1.status).toBe(200);
      expect(r2.status).toBe(200);
    });
  });

  describe('4. Data Conflict & Network Failures', () => {
    it('[STM-IT-05] Mất kết nối DB khi lấy danh sách học viên trả về 500', async () => {
      vi.spyOn(studentManageService, 'getStudentslist').mockRejectedValue(new Error('Connection lost (P1001)'));

      const res = await request(app).get('/api/admin/students?page=1&limit=10');

      expect(res.status).toBe(500);
    });
  });
});
