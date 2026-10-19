import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import dashboardRouter from '../../dashboard.route.js';
import { errorHandler } from '../../../../shared/http/error-handler.js';
import { dashboardService } from '../../dashboard.service.js';

vi.mock('../../../../middleware/authenticate.middleware.js', () => ({
  Authenticate: (req: any, _res: any, next: any) => {
    req.user = { userId: 1, role: 'admin' };
    next();
  },
}));

vi.mock('../../../../middleware/authorize.middleware.js', () => ({
  authorize: () => (_req: any, _res: any, next: any) => next(),
}));

describe('Dashboard Routes - Integration Tests (QC 10-Year Standard)', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/admin/dashboard', dashboardRouter);
    app.use(errorHandler);
  });

  describe('1. Happy Cases', () => {
    it('[DSB-IT-01] GET /api/admin/dashboard/stats trả về 200 kèm thống kê hệ thống', async () => {
      vi.spyOn(dashboardService, 'getDashboardStats').mockResolvedValue({
        totalStudents: 100,
        totalCourses: 10,
        totalWords: 500,
        totalTests: 20,
        levelData: [],
        trafficData: [],
      });

      const res = await request(app).get('/api/admin/dashboard/stats');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalStudents).toBe(100);
    });
  });

  describe('2. Network Failures', () => {
    it('[DSB-IT-02] Mất kết nối DB khi tải Dashboard trả về 500', async () => {
      vi.spyOn(dashboardService, 'getDashboardStats').mockRejectedValue(new Error('Connection lost (P1001)'));

      const res = await request(app).get('/api/admin/dashboard/stats');

      expect(res.status).toBe(500);
    });
  });
});
