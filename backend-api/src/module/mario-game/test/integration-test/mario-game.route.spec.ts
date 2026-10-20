import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import marioGameRouter from '../../mario-game.route.js';
import { errorHandler } from '../../../../shared/http/error-handler.js';
import { MarioGameService } from '../../mario-game.service.js';
import { mockMarioWords, mockMarioMatchPairInput, mockMarioFinishGameInput } from '../data-mock/mario-game.mock.js';

vi.mock('../../../../middleware/authenticate.middleware.js', () => ({
  Authenticate: (req: any, _res: any, next: any) => {
    req.user = { userId: 1, role: 'student' };
    next();
  },
}));

describe('Mario Game Routes - Integration Tests (QC 10-Year Standard)', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/mario-game', marioGameRouter);
    app.use(errorHandler);
  });

  describe('1. Happy Cases', () => {
    it('[MARIO-IT-01] GET /api/mario-game/start bắt đầu ván chơi Mario thành công', async () => {
      vi.spyOn(MarioGameService.prototype, 'startGame').mockResolvedValue({
        totalWords: 4,
        words: mockMarioWords as any,
      });

      const res = await request(app).get('/api/mario-game/start?limit=4');

      expect(res.status).toBe(200);
      expect(res.body.data.totalWords).toBe(4);
    });

    it('[MARIO-IT-02] POST /api/mario-game/match lưu tiến trình tạm thời', async () => {
      vi.spyOn(MarioGameService.prototype, 'matchPair').mockResolvedValue({
        message: 'Lưu tiến trình tạm thời thành công',
        currentScore: 50,
        matchedPairs: 2,
        totalPairs: 4,
      });

      const res = await request(app)
        .post('/api/mario-game/match')
        .send(mockMarioMatchPairInput);

      expect(res.status).toBe(200);
      expect(res.body.data.matchedPairs).toBe(2);
    });

    it('[MARIO-IT-03] POST /api/mario-game/finish chốt kết quả game', async () => {
      vi.spyOn(MarioGameService.prototype, 'finishGame').mockResolvedValue({
        message: 'Hoàn tất ván chơi thành công!',
        result: { totalScore: 100, durationSeconds: 40, correctPairs: 4, totalPairs: 4, currentXp: 150 },
      } as any);

      const res = await request(app)
        .post('/api/mario-game/finish')
        .send(mockMarioFinishGameInput);

      expect(res.status).toBe(200);
      expect(res.body.data.result.totalScore).toBe(100);
    });
  });

  describe('2. Bad End & Validation Cases', () => {
    it('[MARIO-IT-04] GET /api/mario-game/start với limit < 4 trả về 422', async () => {
      const res = await request(app).get('/api/mario-game/start?limit=1');
      expect(res.status).toBe(422);
    });

    it('[MARIO-IT-VAL-01] GET /api/mario-game/start với limit > 20 trả về 422', async () => {
      const res = await request(app).get('/api/mario-game/start?limit=30');
      expect(res.status).toBe(422);
    });

    it('[MARIO-IT-VAL-02] GET /api/mario-game/start với limit không phải số trả về 422', async () => {
      const res = await request(app).get('/api/mario-game/start?limit=abc');
      expect(res.status).toBe(422);
    });

    it('[MARIO-IT-VAL-03] GET /api/mario-game/start với lessonId <= 0 trả về 422', async () => {
      const res = await request(app).get('/api/mario-game/start?lessonId=0');
      expect(res.status).toBe(422);
    });

    it('[MARIO-IT-05] POST /api/mario-game/match điểm số âm trả về 422', async () => {
      const res = await request(app)
        .post('/api/mario-game/match')
        .send({ ...mockMarioMatchPairInput, currentScore: -10 });
      expect(res.status).toBe(422);
    });

    it('[MARIO-IT-VAL-04] POST /api/mario-game/match matchedPairs âm trả về 422', async () => {
      const res = await request(app)
        .post('/api/mario-game/match')
        .send({ ...mockMarioMatchPairInput, matchedPairs: -2 });
      expect(res.status).toBe(422);
    });

    it('[MARIO-IT-VAL-05] POST /api/mario-game/match totalPairs <= 0 trả về 422', async () => {
      const res = await request(app)
        .post('/api/mario-game/match')
        .send({ ...mockMarioMatchPairInput, totalPairs: 0 });
      expect(res.status).toBe(422);
    });

    it('[MARIO-IT-VAL-06] POST /api/mario-game/match thiếu currentScore trả về 422', async () => {
      const res = await request(app)
        .post('/api/mario-game/match')
        .send({ matchedPairs: 2, totalPairs: 4 });
      expect(res.status).toBe(422);
    });

    it('[MARIO-IT-VAL-07] POST /api/mario-game/finish totalScore âm trả về 422', async () => {
      const res = await request(app)
        .post('/api/mario-game/finish')
        .send({ ...mockMarioFinishGameInput, totalScore: -50 });
      expect(res.status).toBe(422);
    });

    it('[MARIO-IT-VAL-08] POST /api/mario-game/finish duration âm trả về 422', async () => {
      const res = await request(app)
        .post('/api/mario-game/finish')
        .send({ ...mockMarioFinishGameInput, duration: -10 });
      expect(res.status).toBe(422);
    });

    it('[MARIO-IT-VAL-09] POST /api/mario-game/finish correctPairs âm trả về 422', async () => {
      const res = await request(app)
        .post('/api/mario-game/finish')
        .send({ ...mockMarioFinishGameInput, correctPairs: -1 });
      expect(res.status).toBe(422);
    });

    it('[MARIO-IT-VAL-10] POST /api/mario-game/finish totalPairs <= 0 trả về 422', async () => {
      const res = await request(app)
        .post('/api/mario-game/finish')
        .send({ ...mockMarioFinishGameInput, totalPairs: 0 });
      expect(res.status).toBe(422);
    });

    it('[MARIO-IT-VAL-11] POST /api/mario-game/finish body rỗng thiếu trường bắt buộc trả về 422', async () => {
      const res = await request(app)
        .post('/api/mario-game/finish')
        .send({});
      expect(res.status).toBe(422);
    });
  });

  describe('3. Concurrency & Network Failures', () => {
    it('[MARIO-IT-CONF-01] POST /api/mario-game/finish xử lý 2 request kết thúc game gửi đồng thời an toàn', async () => {
      vi.spyOn(MarioGameService.prototype, 'finishGame')
        .mockResolvedValueOnce({
          result: { totalScore: 100, durationSeconds: 40 },
        } as any)
        .mockResolvedValueOnce({
          result: { totalScore: 100, durationSeconds: 40 },
        } as any);

      const [res1, res2] = await Promise.all([
        request(app).post('/api/mario-game/finish').send(mockMarioFinishGameInput),
        request(app).post('/api/mario-game/finish').send(mockMarioFinishGameInput),
      ]);

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res1.body.data.result.totalScore).toBe(100);
      expect(res2.body.data.result.totalScore).toBe(100);
    });

    it('[MARIO-IT-06] Lỗi database khi kết thúc ván trả về 500', async () => {
      vi.spyOn(MarioGameService.prototype, 'finishGame').mockRejectedValue(
        new Error('Connection lost (P1001)')
      );

      const res = await request(app)
        .post('/api/mario-game/finish')
        .send(mockMarioFinishGameInput);

      expect(res.status).toBe(500);
    });
  });
});
