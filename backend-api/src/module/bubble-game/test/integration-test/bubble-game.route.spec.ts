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
        result: { id: 1, totalScore: 40, duration: 35 },
      } as any);

      const res = await request(app)
        .post('/api/bubble-game/finish')
        .send(mockFinishGameInput);

      expect(res.status).toBe(200);
      expect(res.body.data.result.totalScore).toBe(40);
    });
  });

  describe('2. Bad End Cases', () => {
    it('[BBG-IT-04] GET /api/bubble-game/start với limit < 4 trả về 422', async () => {
      const res = await request(app).get('/api/bubble-game/start?limit=2');

      expect(res.status).toBe(422);
    });

    it('[BBG-IT-05] POST /api/bubble-game/match thiếu currentScore trả về 422', async () => {
      const res = await request(app)
        .post('/api/bubble-game/match')
        .send({ matchedPairs: 2, totalPairs: 4 });

      expect(res.status).toBe(422);
    });
  });

  describe('3. Network Failures', () => {
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
