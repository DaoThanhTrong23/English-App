import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { gameRouter } from '../../game.route.js';
import { errorHandler } from '../../../../shared/http/error-handler.js';
import { gameService } from '../../game.service.js';
import { mockGameItem, mockGameHistory } from '../data-mock/game.mock.js';

vi.mock('../../../../middleware/authenticate.middleware.js', () => ({
  Authenticate: (req: any, _res: any, next: any) => {
    req.user = { id: 1, role: 'admin' };
    next();
  },
}));

vi.mock('../../../../middleware/authorize.middleware.js', () => ({
  authorize: () => (_req: any, _res: any, next: any) => next(),
}));

describe('Game Routes - Integration Tests (QC 10-Year Standard)', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/games', gameRouter);
    app.use(errorHandler);
  });

  describe('1. Happy Cases', () => {
    it('[GAME-IT-01] GET /api/games/history lấy lịch sử chơi của user', async () => {
      vi.spyOn(gameService, 'getHistory').mockResolvedValue({
        history: [mockGameHistory as any],
        stats: [{ gameCode: 'bubble_burst', _max: { score: 100 }, _count: { id: 1 } }] as any,
      });

      const res = await request(app).get('/api/games/history');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.history).toHaveLength(1);
    });

    it('[GAME-IT-02] GET /api/games/:code/play lấy dữ liệu ván chơi', async () => {
      vi.spyOn(gameService, 'play').mockResolvedValue({
        game: { id: 1, name: 'Bubble', code: 'bubble_burst' },
        setting: { difficulty: 'EASY', itemCount: 6, pointsPerItem: 10, timeLimit: 60 },
        words: [],
      } as any);

      const res = await request(app).get('/api/games/bubble_burst/play?difficulty=EASY');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.game.code).toBe('bubble_burst');
    });

    it('[GAME-IT-03] GET /api/games/admin lấy danh sách game cho admin', async () => {
      vi.spyOn(gameService, 'getAllGames').mockResolvedValue([mockGameItem as any]);

      const res = await request(app).get('/api/games/admin');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });

    it('[GAME-IT-LOG-01] PUT /api/games/admin/:id/settings cập nhật cấu hình game thành công', async () => {
      vi.spyOn(gameService, 'updateSettings').mockResolvedValue([
        { id: 1, gameId: 1, difficulty: 'EASY', itemCount: 8, pointsPerItem: 15, timeLimit: null, createdAt: new Date(), updatedAt: new Date() }
      ] as any);

      const res = await request(app)
        .put('/api/games/admin/1/settings')
        .send({ settings: [{ difficulty: 'EASY', itemCount: 8, pointsPerItem: 15 }] });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Cập nhật cấu hình');
    });
  });

  describe('2. Validation & Invalid Input Cases', () => {
    it('[GAME-IT-04] PUT /api/games/admin/:id/settings với danh sách rỗng trả về 422', async () => {
      const res = await request(app)
        .put('/api/games/admin/1/settings')
        .send({ settings: [] });

      expect(res.status).toBe(422);
    });

    it('[GAME-IT-VAL-01] PUT /api/games/admin/:id/settings với difficulty không hợp lệ trả về 422', async () => {
      const res = await request(app)
        .put('/api/games/admin/1/settings')
        .send({ settings: [{ difficulty: 'IMPOSSIBLE', itemCount: 6, pointsPerItem: 10 }] });

      expect(res.status).toBe(422);
    });

    it('[GAME-IT-VAL-02] PUT /api/games/admin/:id/settings với itemCount <= 0 trả về 422', async () => {
      const res = await request(app)
        .put('/api/games/admin/1/settings')
        .send({ settings: [{ difficulty: 'EASY', itemCount: 0, pointsPerItem: 10 }] });

      expect(res.status).toBe(422);
    });

    it('[GAME-IT-VAL-03] PUT /api/games/admin/:id/settings với pointsPerItem âm trả về 422', async () => {
      const res = await request(app)
        .put('/api/games/admin/1/settings')
        .send({ settings: [{ difficulty: 'EASY', itemCount: 6, pointsPerItem: -5 }] });

      expect(res.status).toBe(422);
    });

    it('[GAME-IT-VAL-04] PUT /api/games/admin/:id/settings với param id <= 0 trả về 422', async () => {
      const res = await request(app)
        .put('/api/games/admin/0/settings')
        .send({ settings: [{ difficulty: 'EASY', itemCount: 6, pointsPerItem: 10 }] });

      expect(res.status).toBe(422);
    });
  });

  describe('3. Concurrency & Network Failures', () => {
    it('[GAME-IT-CONF-01] PUT /api/games/admin/:id/settings mô phỏng 2 admin cập nhật cấu hình đồng thời', async () => {
      vi.spyOn(gameService, 'updateSettings')
        .mockResolvedValueOnce([{ id: 1, difficulty: 'EASY', itemCount: 6 }] as any)
        .mockResolvedValueOnce([{ id: 1, difficulty: 'EASY', itemCount: 8 }] as any);

      const [res1, res2] = await Promise.all([
        request(app)
          .put('/api/games/admin/1/settings')
          .send({ settings: [{ difficulty: 'EASY', itemCount: 6, pointsPerItem: 10 }] }),
        request(app)
          .put('/api/games/admin/1/settings')
          .send({ settings: [{ difficulty: 'EASY', itemCount: 8, pointsPerItem: 15 }] }),
      ]);

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res1.body.success).toBe(true);
      expect(res2.body.success).toBe(true);
    });

    it('[GAME-IT-05] Mất kết nối database khi lấy history trả về 500', async () => {
      vi.spyOn(gameService, 'getHistory').mockRejectedValue(new Error('Connection lost (P1001)'));

      const res = await request(app).get('/api/games/history');

      expect(res.status).toBe(500);
    });
  });
});
