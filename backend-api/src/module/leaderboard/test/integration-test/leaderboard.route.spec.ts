import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { leaderboardRouter } from '../../leaderboard.route.js';
import { errorHandler } from '../../../../shared/http/error-handler.js';
import { leaderboardService } from '../../leaderboard.service.js';

let mockUser: { userId: number; role: string } | null = { userId: 3, role: 'user' };

vi.mock('../../../../middleware/authenticate.middleware.js', () => ({
  Authenticate: (req: any, res: any, next: any) => {
    if (!mockUser) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    req.user = mockUser;
    next();
  },
}));

describe('Leaderboard Routes - Integration Tests (QC 10-Year Standard)', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { userId: 3, role: 'user' };
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

  describe('2. Security & Access Control Cases', () => {
    it('[LDB-IT-SEC-01] Chưa xác thực / không có token trả về 401 Unauthorized', async () => {
      mockUser = null;

      const res = await request(app).get('/api/student/leaderboard');

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Unauthorized');
    });

    it('[LDB-IT-SEC-02] Bảng xếp hạng là Read-Only: Cố tình POST / PUT thao túng điểm số bị từ chối 404', async () => {
      const resPost = await request(app)
        .post('/api/student/leaderboard')
        .send({ xpPoints: 999999, rank: 1 });

      expect(resPost.status).toBe(404);

      const resPut = await request(app)
        .put('/api/student/leaderboard')
        .send({ xpPoints: 999999 });

      expect(resPut.status).toBe(404);
    });

    it('[LDB-IT-SEC-03] Thử SQL Injection qua query param limit (?limit=1; DROP TABLE users;)', async () => {
      const spy = vi.spyOn(leaderboardService, 'getLeaderboard').mockResolvedValue({
        topUsers: [],
        currentUser: { id: 3, xpPoints: 0, rank: 0 },
      });

      const res = await request(app).get('/api/student/leaderboard?limit=1; DROP TABLE users;');

      expect(res.status).toBe(200);
      // Limit không hợp lệ phải được fallback về cận an toàn, không bị injection
      expect(spy).toHaveBeenCalledWith(3, 20);
    });

    it('[LDB-IT-SEC-04] Chống rò rỉ dữ liệu nhạy cảm (Data Privacy / Exfiltration Prevention)', async () => {
      vi.spyOn(leaderboardService, 'getLeaderboard').mockResolvedValue({
        topUsers: [
          {
            id: 1,
            username: 'top1',
            avatarUrl: 'https://example.com/avatar.png',
            cefrLevel: 'C1',
            xpPoints: 1200,
          } as any,
        ],
        currentUser: { id: 3, xpPoints: 500, rank: 3 } as any,
      });

      const res = await request(app).get('/api/student/leaderboard');

      expect(res.status).toBe(200);
      const topStudent = res.body.data.topUsers[0];
      // Đảm bảo không chứa bất kỳ trường thông tin nhạy cảm nào
      expect(topStudent).not.toHaveProperty('password');
      expect(topStudent).not.toHaveProperty('passwordHash');
      expect(topStudent).not.toHaveProperty('email');
      expect(topStudent).not.toHaveProperty('phone');
      expect(topStudent).not.toHaveProperty('role');
      expect(topStudent).not.toHaveProperty('refreshToken');
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
