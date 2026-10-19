import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { topicRouter } from '../../topic.route.js';
import { errorHandler } from '../../../../shared/http/error-handler.js';
import { topicService } from '../../topic.service.js';

vi.mock('../../../../middleware/authenticate.middleware.js', () => ({
  Authenticate: (req: any, _res: any, next: any) => {
    req.user = { userId: 1, role: 'admin' };
    next();
  },
}));

vi.mock('../../../../middleware/authorize.middleware.js', () => ({
  authorize: () => (_req: any, _res: any, next: any) => next(),
}));

describe('Topic Routes - Integration Tests (QC 10-Year Standard)', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
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
  });

  describe('3. Network Failures', () => {
    it('[TOP-IT-05] Mất kết nối DB khi lấy danh sách trả về 500', async () => {
      vi.spyOn(topicService, 'getAllTopics').mockRejectedValue(new Error('Connection lost (P1001)'));

      const res = await request(app).get('/api/admin/topics');

      expect(res.status).toBe(500);
    });
  });
});
