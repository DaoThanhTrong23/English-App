import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { topicRouter } from '../../topic.route.js';
import { errorHandler } from '../../../../shared/http/error-handler.js';
import { topicService } from '../../topic.service.js';
import { ApiError } from '../../../../shared/http/api-error.js';

let mockUser: { userId: number; role: string } | null = { userId: 1, role: 'admin' };

vi.mock('../../../../middleware/authenticate.middleware.js', () => ({
  Authenticate: (req: any, res: any, next: any) => {
    if (!mockUser) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    req.user = mockUser;
    next();
  },
}));

vi.mock('../../../../middleware/authorize.middleware.js', () => ({
  authorize: (allowedRoles: string[]) => (req: any, _res: any, next: any) => {
    if (!allowedRoles.includes(req.user?.role)) {
      return next(new ApiError(403, 'forbidden', 'Bạn không có quyền thực hiện hành động này'));
    }
    next();
  },
}));

describe('Topic Routes - Integration Tests (QC 10-Year Standard)', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { userId: 1, role: 'admin' };
    app = express();
    app.use(express.json());
    app.use('/api/admin/topics', topicRouter);
    app.use(errorHandler);
  });

  describe('1. Happy Cases', () => {
    it('[TOP-IT-01] GET /api/admin/topics trả về danh sách chủ đề', async () => {
      vi.spyOn(topicService, 'getAllTopics').mockResolvedValue([
        { id: 1, title: 'Chủ đề 1' } as any,
      ]);

      const res = await request(app).get('/api/admin/topics');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
    });

    it('[TOP-IT-02] POST /api/admin/topics tạo chủ đề mới', async () => {
      vi.spyOn(topicService, 'createTopic').mockResolvedValue({
        id: 2,
        title: 'Chủ đề 2',
      } as any);

      const res = await request(app)
        .post('/api/admin/topics')
        .send({ title: 'Chủ đề 2' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('[TOP-IT-03] DELETE /api/admin/topics/:id xóa chủ đề', async () => {
      vi.spyOn(topicService, 'deleteTopic').mockResolvedValue({ id: 1 } as any);

      const res = await request(app).delete('/api/admin/topics/1');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('2. Bad End Cases', () => {
    it('[TOP-IT-04] POST /api/admin/topics thiếu title trả về 422', async () => {
      const res = await request(app)
        .post('/api/admin/topics')
        .send({ description: 'Thiếu title' });

      expect(res.status).toBe(422);
    });

    it('[TOP-IT-SEC-01] Học viên thường (role user) cố tình tạo chủ đề bị từ chối 403 Forbidden', async () => {
      mockUser = { userId: 5, role: 'user' };

      const res = await request(app)
        .post('/api/admin/topics')
        .send({ title: 'Topic Hacked', cefrLevel: 'A1' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('forbidden');
    });

    it('[TOP-IT-SEC-02] Học viên thường cố tình xóa chủ đề bị từ chối 403 Forbidden', async () => {
      mockUser = { userId: 5, role: 'user' };

      const res = await request(app).delete('/api/admin/topics/1');

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('forbidden');
    });

    it('[TOP-IT-SEC-03] Chưa đăng nhập truy cập quản trị chủ đề trả về 401 Unauthorized', async () => {
      mockUser = null;

      const res = await request(app).get('/api/admin/topics');

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Unauthorized');
    });

    it('[TOP-IT-SEC-04] Thử SQL Injection qua query param cefrLevel (?cefrLevel=\' OR 1=1 --)', async () => {
      const spy = vi.spyOn(topicService, 'getAllTopics').mockResolvedValue([]);

      const res = await request(app).get('/api/admin/topics?cefrLevel=\' OR 1=1 --');

      expect(res.status).toBe(200);
      expect(spy).toHaveBeenCalledWith("' OR 1=1 --");
    });
  });

  describe('3. Network Failures', () => {
    it('[TOP-IT-05] Mất kết nối DB khi lấy danh sách trả về 500', async () => {
      vi.spyOn(topicService, 'getAllTopics').mockRejectedValue(new Error('Connection lost (P1001)'));

      const res = await request(app).get('/api/admin/topics');

      expect(res.status).toBe(500);
    });
  });
});
