import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { activityLogRouter } from '../../activity-log.route.js';
import { errorHandler } from '../../../../shared/http/error-handler.js';
import { activityLogService } from '../../activity-log.service.js';

vi.mock('../../../../middleware/authenticate.middleware.js', () => ({
  Authenticate: (req: any, _res: any, next: any) => {
    req.user = { userId: 1, role: 'admin' };
    next();
  },
}));

vi.mock('../../../../middleware/authorize.middleware.js', () => ({
  authorize: () => (_req: any, _res: any, next: any) => next(),
}));

describe('ActivityLog Routes - Integration Tests (QC 10-Year Standard)', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/admin/logs', activityLogRouter);
    app.use(errorHandler);
  });

  describe('1. Happy Cases', () => {
    it('[LOG-IT-01] GET /api/admin/logs/activities trả về danh sách lịch sử hoạt động', async () => {
      vi.spyOn(activityLogService, 'getActivities').mockResolvedValue({
        items: [{ id: 1, actionType: 'USER_LOGIN' } as any],
        pagination: { totalItems: 1, totalPages: 1, currentPage: 1, limit: 20 },
      });

      const res = await request(app).get('/api/admin/logs/activities?page=1&limit=20');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBe(1);
    });

    it('[LOG-IT-02] GET /api/admin/logs/login-logs trả về danh sách lịch sử đăng nhập', async () => {
      vi.spyOn(activityLogService, 'getLoginLogs').mockResolvedValue({
        items: [{ id: 1, ipAddress: '127.0.0.1' } as any],
        pagination: { totalItems: 1, totalPages: 1, currentPage: 1, limit: 20 },
      });

      const res = await request(app).get('/api/admin/logs/login-logs');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items[0].ipAddress).toBe('127.0.0.1');
    });
  });

  describe('2. Concurrency & Network Failures', () => {
    it('[LOG-IT-03] Mất kết nối DB khi truy vấn login logs trả về 500', async () => {
      vi.spyOn(activityLogService, 'getLoginLogs').mockRejectedValue(new Error('Connection timeout (P1008)'));

      const res = await request(app).get('/api/admin/logs/login-logs');

      expect(res.status).toBe(500);
    });
  });
});
