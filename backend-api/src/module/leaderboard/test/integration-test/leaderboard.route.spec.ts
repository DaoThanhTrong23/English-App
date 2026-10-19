import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { leaderboardRouter } from '../../leaderboard.route.js';
import { errorHandler } from '../../../../shared/http/error-handler.js';
import { leaderboardService } from '../../leaderboard.service.js';

vi.mock('../../../../middleware/authenticate.middleware.js', () => ({
  Authenticate: (req: any, _res: any, next: any) => {
    req.user = { userId: 3, role: 'user' };
    next();
  },
}));

describe('Leaderboard Routes - Integration Tests (QC 10-Year Standard)', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/student/leaderboard', leaderboardRouter);
    app.use(errorHandler);
  });

  describe('1. Happy Cases', () => {
    it('[LDB-IT-01] GET /api/student/leaderboard trả về 200 kèm top học viên', async () => {
      vi.spyOn(leaderboardService, 'getLeaderboard').mockResolvedValue({
        topUsers: [{ id: 1, username: 'top1', xpPoints: 1000 } as any],
        currentUser: { id: 3, xpPoints: 500, rank: 3 } as any,
      });

      const res = await request(app).get('/api/student/leaderboard');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.topUsers.length).toBe(1);
      expect(res.body.data.currentUser.rank).toBe(3);
    });
  });

  describe('2. Network Failures', () => {
    it('[LDB-IT-02] Mất kết nối DB khi lấy BXH trả về 500', async () => {
      vi.spyOn(leaderboardService, 'getLeaderboard').mockRejectedValue(new Error('Connection lost (P1001)'));

      const res = await request(app).get('/api/student/leaderboard');

      expect(res.status).toBe(500);
    });
  });
});
