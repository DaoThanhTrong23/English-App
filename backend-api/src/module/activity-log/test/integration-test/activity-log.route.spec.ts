import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { activityLogRouter } from '../../activity-log.route.js';
import { errorHandler } from '../../../../shared/http/error-handler.js';
import { activityLogService } from '../../activity-log.service.js';
import { ApiError } from '../../../../shared/http/api-error.js';

let currentUser: any = { userId: 1, role: 'admin' };

vi.mock('../../../../middleware/authenticate.middleware.js', () => ({
  Authenticate: (req: any, _res: any, next: any) => {
    if (currentUser) {
      req.user = currentUser;
      next();
    } else {
      next(new ApiError(401, 'unauthorized', 'Thông tin người dùng chưa được xác thực'));
    }
  },
}));

describe('ActivityLog Routes - Integration Tests (QC 10-Year Standard)', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    currentUser = { userId: 1, role: 'admin' };
    app = express();
    app.use(express.json());
    app.use('/api/admin/logs', activityLogRouter);
    app.use(errorHandler);
  });

  describe('1. Phân Quyền & Xác Thực (Authorization & Authentication)', () => {
    it('[LOG-IT-AUTH-01] GET /api/admin/logs/activities: Học viên (role: user) truy cập bị chặn với HTTP 403 Forbidden', async () => {
      currentUser = { userId: 2, role: 'user' };

      const res = await request(app).get('/api/admin/logs/activities');

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('forbidden');
      expect(res.body.message).toContain('Bạn không có quyền');
    });

    it('[LOG-IT-AUTH-02] GET /api/admin/logs/login-logs: Học viên (role: user) truy cập bị chặn với HTTP 403 Forbidden', async () => {
      currentUser = { userId: 2, role: 'user' };

      const res = await request(app).get('/api/admin/logs/login-logs');

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('forbidden');
    });

    it('[LOG-IT-AUTH-03] GET /api/admin/logs/activities: Request không gửi Token xác thực trả về 401 Unauthorized', async () => {
      currentUser = null;

      const res = await request(app).get('/api/admin/logs/activities');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('unauthorized');
    });

    it('[LOG-IT-AUTH-04] GET /api/admin/logs/login-logs: Request không gửi Token xác thực trả về 401 Unauthorized', async () => {
      currentUser = null;

      const res = await request(app).get('/api/admin/logs/login-logs');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('unauthorized');
    });
  });

  describe('2. Happy Cases (Dành cho Admin)', () => {
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

  describe('3. Bad End Cases', () => {
    it('[LOG-IT-03] GET /api/admin/logs/activities với page âm hoặc không hợp lệ trả về kết quả an toàn', async () => {
      vi.spyOn(activityLogService, 'getActivities').mockResolvedValue({
        items: [],
        pagination: { totalItems: 0, totalPages: 1, currentPage: 1, limit: 20 },
      });

      const res = await request(app).get('/api/admin/logs/activities?page=-1');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('4. Network Failures', () => {
    it('[LOG-IT-04] Mất kết nối DB khi truy vấn login logs trả về 500', async () => {
      vi.spyOn(activityLogService, 'getLoginLogs').mockRejectedValue(new Error('Connection timeout (P1008)'));

      const res = await request(app).get('/api/admin/logs/login-logs');

      expect(res.status).toBe(500);
    });
  });
});
