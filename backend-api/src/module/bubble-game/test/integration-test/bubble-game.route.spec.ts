import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import bubbleGameRouter from '../../bubble-game.route.js';
import { errorHandler } from '../../../../shared/http/error-handler.js';
import { BubbleGameService } from '../../bubble-game.service.js';
import { mockBubbleWords, mockMatchPairInput, mockFinishGameInput } from '../data-mock/bubble-game.mock.js';

vi.mock('../../../../middleware/authenticate.middleware.js', () => ({
  Authenticate: (req: any, _res: any, next: any) => {
    req.user = { userId: 1, role: 'student' };
    next();
  },
}));

describe('Bubble Game Routes - Integration Tests (QC 10-Year Standard)', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/bubble-game', bubbleGameRouter);
    app.use(errorHandler);
  });

  describe('1. Happy Cases', () => {
    it('[BBG-IT-01] GET /api/bubble-game/start bắt đầu ván chơi thành công', async () => {
      vi.spyOn(BubbleGameService.prototype, 'startGame').mockResolvedValue({
        totalPairs: 4,
        wordBubbles: [{ id: 1, word: 'apple' }] as any,
        meaningBubbles: [{ id: 1, meaning: 'quả táo' }] as any,
      });

      const res = await request(app).get('/api/bubble-game/start?limit=4');

      expect(res.status).toBe(200);
      expect(res.body.data.totalPairs).toBe(4);
    });

    it('[BBG-IT-02] POST /api/bubble-game/match lưu tiến trình tạm thời', async () => {
      vi.spyOn(BubbleGameService.prototype, 'matchPair').mockResolvedValue({
        message: 'Lưu tiến trình tạm thời thành công',
        currentScore: 20,
        matchedPairs: 2,
        totalPairs: 4,
      });

      const res = await request(app)
        .post('/api/bubble-game/match')
        .send(mockMatchPairInput);

      expect(res.status).toBe(200);
      expect(res.body.data.matchedPairs).toBe(2);
    });

    it('[BBG-IT-03] POST /api/bubble-game/finish chốt kết quả kết thúc ván', async () => {
      vi.spyOn(BubbleGameService.prototype, 'finishGame').mockResolvedValue({
        message: 'Hoàn tất ván chơi thành công!',
        result: { totalScore: 40, durationSeconds: 35, correctPairs: 4, totalPairs: 4, currentXp: 100 },
      } as any);

      const res = await request(app)
        .post('/api/bubble-game/finish')
        .send(mockFinishGameInput);

      expect(res.status).toBe(200);
      expect(res.body.data.result.totalScore).toBe(40);
    });
  });

  describe('2. Validation & Invalid Input Cases', () => {
    it('[BBG-IT-04] GET /api/bubble-game/start với limit < 4 trả về 422', async () => {
      const res = await request(app).get('/api/bubble-game/start?limit=2');
      expect(res.status).toBe(422);
    });

    it('[BBG-IT-VAL-01] GET /api/bubble-game/start với limit > 20 trả về 422', async () => {
      const res = await request(app).get('/api/bubble-game/start?limit=25');
      expect(res.status).toBe(422);
    });

    it('[BBG-IT-VAL-02] GET /api/bubble-game/start với limit là chuỗi không hợp lệ trả về 422', async () => {
      const res = await request(app).get('/api/bubble-game/start?limit=abc');
      expect(res.status).toBe(422);
    });

    it('[BBG-IT-VAL-03] GET /api/bubble-game/start với lessonId <= 0 trả về 422', async () => {
      const res = await request(app).get('/api/bubble-game/start?lessonId=0');
      expect(res.status).toBe(422);
    });

    it('[BBG-IT-05] POST /api/bubble-game/match thiếu currentScore trả về 422', async () => {
      const res = await request(app)
        .post('/api/bubble-game/match')
        .send({ matchedPairs: 2, totalPairs: 4 });
      expect(res.status).toBe(422);
    });

    it('[BBG-IT-VAL-04] POST /api/bubble-game/match với currentScore âm trả về 422', async () => {
      const res = await request(app)
        .post('/api/bubble-game/match')
        .send({ ...mockMatchPairInput, currentScore: -10 });
      expect(res.status).toBe(422);
    });

    it('[BBG-IT-VAL-05] POST /api/bubble-game/match với matchedPairs âm trả về 422', async () => {
      const res = await request(app)
        .post('/api/bubble-game/match')
        .send({ ...mockMatchPairInput, matchedPairs: -1 });
      expect(res.status).toBe(422);
    });

    it('[BBG-IT-VAL-06] POST /api/bubble-game/match với totalPairs <= 0 trả về 422', async () => {
      const res = await request(app)
        .post('/api/bubble-game/match')
        .send({ ...mockMatchPairInput, totalPairs: 0 });
      expect(res.status).toBe(422);
    });

    it('[BBG-IT-VAL-07] POST /api/bubble-game/finish với totalScore âm trả về 422', async () => {
      const res = await request(app)
        .post('/api/bubble-game/finish')
        .send({ ...mockFinishGameInput, totalScore: -20 });
      expect(res.status).toBe(422);
    });

    it('[BBG-IT-VAL-08] POST /api/bubble-game/finish với duration âm trả về 422', async () => {
      const res = await request(app)
        .post('/api/bubble-game/finish')
        .send({ ...mockFinishGameInput, duration: -5 });
      expect(res.status).toBe(422);
    });

    it('[BBG-IT-VAL-09] POST /api/bubble-game/finish với correctPairs âm trả về 422', async () => {
      const res = await request(app)
        .post('/api/bubble-game/finish')
        .send({ ...mockFinishGameInput, correctPairs: -1 });
      expect(res.status).toBe(422);
    });

    it('[BBG-IT-VAL-10] POST /api/bubble-game/finish với totalPairs <= 0 trả về 422', async () => {
      const res = await request(app)
        .post('/api/bubble-game/finish')
        .send({ ...mockFinishGameInput, totalPairs: 0 });
      expect(res.status).toBe(422);
    });

    it('[BBG-IT-VAL-11] POST /api/bubble-game/finish với body rỗng thiếu toàn bộ trường bắt buộc trả về 422', async () => {
      const res = await request(app)
        .post('/api/bubble-game/finish')
        .send({});
      expect(res.status).toBe(422);
    });
  });

  describe('3. Concurrency & Network Failures', () => {
    it('[BBG-IT-CONF-01] POST /api/bubble-game/finish xử lý 2 request kết thúc game gửi đồng thời an toàn', async () => {
      vi.spyOn(BubbleGameService.prototype, 'finishGame')
        .mockResolvedValueOnce({
          result: { totalScore: 40, durationSeconds: 35 },
        } as any)
        .mockResolvedValueOnce({
          result: { totalScore: 40, durationSeconds: 35 },
        } as any);

      const [res1, res2] = await Promise.all([
        request(app).post('/api/bubble-game/finish').send(mockFinishGameInput),
        request(app).post('/api/bubble-game/finish').send(mockFinishGameInput),
      ]);

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res1.body.data.result.totalScore).toBe(40);
      expect(res2.body.data.result.totalScore).toBe(40);
    });

    it('[BBG-IT-06] Lỗi database khi kết thúc ván trả về 500', async () => {
      vi.spyOn(BubbleGameService.prototype, 'finishGame').mockRejectedValue(
        new Error('Connection lost (P1001)')
      );

      const res = await request(app)
        .post('/api/bubble-game/finish')
        .send(mockFinishGameInput);

      expect(res.status).toBe(500);
    });
  });
});
