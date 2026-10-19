import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import achievementRouter from '../../achievement.route.js';
import { errorHandler } from '../../../../shared/http/error-handler.js';
import { achievementService } from '../../achievement.service.js';

vi.mock('../../../../middleware/authenticate.middleware.js', () => ({
  Authenticate: (req: any, _res: any, next: any) => {
    req.user = { id: 1, role: 'admin' };
    next();
  },
}));

vi.mock('../../../../middleware/authorize.middleware.js', () => ({
  authorize: () => (_req: any, _res: any, next: any) => next(),
}));

describe('Achievement Routes - Integration Tests (QC 10-Year Standard)', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/admin/achievements', achievementRouter);
    app.use(errorHandler);
  });

  describe('1. Happy Cases', () => {
    it('[ACH-IT-01] GET /api/admin/achievements trả về danh sách danh hiệu', async () => {
      vi.spyOn(achievementService, 'getList').mockResolvedValue([
        { id: 1, title: 'Chăm chỉ', requireXp: 100, requireStreak: 3 } as any,
      ]);

      const res = await request(app).get('/api/admin/achievements');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
    });

    it('[ACH-IT-02] POST /api/admin/achievements tạo danh hiệu mới', async () => {
      vi.spyOn(achievementService, 'create').mockResolvedValue({
        id: 2,
        title: 'Bậc thầy',
        requireXp: 1000,
        requireStreak: 30,
      } as any);

      const res = await request(app)
        .post('/api/admin/achievements')
        .send({ title: 'Bậc thầy', requireXp: 1000, requireStreak: 30 });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Bậc thầy');
    });

    it('[ACH-IT-03] DELETE /api/admin/achievements/:id xóa danh hiệu thành công', async () => {
      vi.spyOn(achievementService, 'delete').mockResolvedValue({
        success: true,
        message: 'Xóa danh hiệu thành công',
      });

      const res = await request(app).delete('/api/admin/achievements/1');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('2. Bad End Cases', () => {
    it('[ACH-IT-04] POST /api/admin/achievements thiếu title trả về 422', async () => {
      const res = await request(app)
        .post('/api/admin/achievements')
        .send({ requireXp: 100 });

      expect(res.status).toBe(422);
    });
  });

  describe('3. Concurrency Cases', () => {
    it('[ACH-IT-05] 2 request xóa và tạo song song', async () => {
      vi.spyOn(achievementService, 'create').mockResolvedValue({ id: 3 } as any);
      vi.spyOn(achievementService, 'delete').mockResolvedValue({ success: true } as any);

      const [r1, r2] = await Promise.all([
        request(app).post('/api/admin/achievements').send({ title: 'A3', requireXp: 50, requireStreak: 2 }),
        request(app).delete('/api/admin/achievements/2'),
      ]);

      expect(r1.status).toBe(201);
      expect(r2.status).toBe(200);
    });
  });

  describe('4. Data Conflict & Network Failures', () => {
    it('[ACH-IT-06] Mất kết nối DB khi lấy danh sách trả về 500', async () => {
      vi.spyOn(achievementService, 'getList').mockRejectedValue(new Error('Connection lost (P1001)'));

      const res = await request(app).get('/api/admin/achievements');

      expect(res.status).toBe(500);
    });
  });
});
