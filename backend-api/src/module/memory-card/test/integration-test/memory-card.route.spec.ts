import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import memoryCardRouter from '../../memory-card.route.js';
import { errorHandler } from '../../../../shared/http/error-handler.js';
import { memoryCardService } from '../../memory-card.service.js';
import {
  mockSaveMemoryProgressInput,
  mockFinishMemoryInput,
} from '../data-mock/memory-card.mock.js';

vi.mock('../../../../middleware/authenticate.middleware.js', () => ({
  Authenticate: (req: any, _res: any, next: any) => {
    req.user = { userId: 1, role: 'student' };
    next();
  },
}));

describe('Memory Card Routes - Integration Tests (QC 10-Year Standard)', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/memory-card', memoryCardRouter);
    app.use(errorHandler);
  });

  describe('1. Happy Cases', () => {
    it('[MEM-IT-01] GET /api/memory-card/start khởi tạo bàn chơi lật thẻ', async () => {
      vi.spyOn(memoryCardService, 'startGame').mockResolvedValue({
        totalPairs: 6,
        totalCards: 12,
        cards: [],
      } as any);

      const res = await request(app).get('/api/memory-card/start?limit=6');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalCards).toBe(12);
    });

    it('[MEM-IT-02] POST /api/memory-card/progress cập nhật tiến trình', async () => {
      vi.spyOn(memoryCardService, 'saveProgress').mockResolvedValue({
        message: 'Lưu tiến trình tạm thời thành công',
        currentScore: 30,
        matchedPairs: 3,
        totalPairs: 6,
        turns: 8,
      });

      const res = await request(app)
        .post('/api/memory-card/progress')
        .send(mockSaveMemoryProgressInput);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.matchedPairs).toBe(3);
    });

    it('[MEM-IT-03] POST /api/memory-card/finish chốt kết quả ván chơi', async () => {
      vi.spyOn(memoryCardService, 'finishGame').mockResolvedValue({
        message: 'Hoàn tất ván Memory Card thành công!',
        result: {
          totalScore: 60,
          durationSeconds: 45,
          turns: 12,
          correctPairs: 6,
          totalPairs: 6,
          currentXp: 180,
        },
      });

      const res = await request(app)
        .post('/api/memory-card/finish')
        .send(mockFinishMemoryInput);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.result.totalScore).toBe(60);
    });
  });

  describe('2. Validation & Invalid Input Cases', () => {
    it('[MEM-IT-04] GET /api/memory-card/start limit không hợp lệ trả về 422', async () => {
      const res = await request(app).get('/api/memory-card/start?limit=1');
      expect(res.status).toBe(422);
    });

    it('[MEM-IT-VAL-01] GET /api/memory-card/start limit > 12 trả về 422', async () => {
      const res = await request(app).get('/api/memory-card/start?limit=15');
      expect(res.status).toBe(422);
    });

    it('[MEM-IT-VAL-02] GET /api/memory-card/start limit chuỗi chữ trả về 422', async () => {
      const res = await request(app).get('/api/memory-card/start?limit=abc');
      expect(res.status).toBe(422);
    });

    it('[MEM-IT-VAL-03] GET /api/memory-card/start lessonId <= 0 trả về 422', async () => {
      const res = await request(app).get('/api/memory-card/start?lessonId=0');
      expect(res.status).toBe(422);
    });

    it('[MEM-IT-05] POST /api/memory-card/progress turns âm trả về 422', async () => {
      const res = await request(app)
        .post('/api/memory-card/progress')
        .send({ ...mockSaveMemoryProgressInput, turns: -1 });
      expect(res.status).toBe(422);
    });

    it('[MEM-IT-VAL-04] POST /api/memory-card/progress currentScore âm trả về 422', async () => {
      const res = await request(app)
        .post('/api/memory-card/progress')
        .send({ ...mockSaveMemoryProgressInput, currentScore: -5 });
      expect(res.status).toBe(422);
    });

    it('[MEM-IT-VAL-05] POST /api/memory-card/progress matchedPairs âm trả về 422', async () => {
      const res = await request(app)
        .post('/api/memory-card/progress')
        .send({ ...mockSaveMemoryProgressInput, matchedPairs: -1 });
      expect(res.status).toBe(422);
    });

    it('[MEM-IT-VAL-06] POST /api/memory-card/progress totalPairs <= 0 trả về 422', async () => {
      const res = await request(app)
        .post('/api/memory-card/progress')
        .send({ ...mockSaveMemoryProgressInput, totalPairs: 0 });
      expect(res.status).toBe(422);
    });

    it('[MEM-IT-VAL-07] POST /api/memory-card/progress thiếu trường bắt buộc trả về 422', async () => {
      const res = await request(app)
        .post('/api/memory-card/progress')
        .send({ turns: 5 });
      expect(res.status).toBe(422);
    });

    it('[MEM-IT-VAL-08] POST /api/memory-card/finish totalScore âm trả về 422', async () => {
      const res = await request(app)
        .post('/api/memory-card/finish')
        .send({ ...mockFinishMemoryInput, totalScore: -10 });
      expect(res.status).toBe(422);
    });

    it('[MEM-IT-VAL-09] POST /api/memory-card/finish duration âm trả về 422', async () => {
      const res = await request(app)
        .post('/api/memory-card/finish')
        .send({ ...mockFinishMemoryInput, duration: -2 });
      expect(res.status).toBe(422);
    });

    it('[MEM-IT-VAL-10] POST /api/memory-card/finish turns âm trả về 422', async () => {
      const res = await request(app)
        .post('/api/memory-card/finish')
        .send({ ...mockFinishMemoryInput, turns: -1 });
      expect(res.status).toBe(422);
    });

    it('[MEM-IT-VAL-11] POST /api/memory-card/finish correctPairs âm trả về 422', async () => {
      const res = await request(app)
        .post('/api/memory-card/finish')
        .send({ ...mockFinishMemoryInput, correctPairs: -1 });
      expect(res.status).toBe(422);
    });

    it('[MEM-IT-VAL-12] POST /api/memory-card/finish body rỗng trả về 422', async () => {
      const res = await request(app)
        .post('/api/memory-card/finish')
        .send({});
      expect(res.status).toBe(422);
    });
  });

  describe('3. Concurrency & Network Failures', () => {
    it('[MEM-IT-CONF-01] POST /api/memory-card/finish xử lý 2 request chốt kết quả gửi đồng thời an toàn', async () => {
      vi.spyOn(memoryCardService, 'finishGame')
        .mockResolvedValueOnce({
          message: 'Hoàn tất ván Memory Card thành công!',
          result: { totalScore: 60, durationSeconds: 45 },
        } as any)
        .mockResolvedValueOnce({
          message: 'Hoàn tất ván Memory Card thành công!',
          result: { totalScore: 60, durationSeconds: 45 },
        } as any);

      const [res1, res2] = await Promise.all([
        request(app).post('/api/memory-card/finish').send(mockFinishMemoryInput),
        request(app).post('/api/memory-card/finish').send(mockFinishMemoryInput),
      ]);

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res1.body.data.result.totalScore).toBe(60);
      expect(res2.body.data.result.totalScore).toBe(60);
    });

    it('[MEM-IT-06] Database lỗi khi kết thúc ván trả về 500', async () => {
      vi.spyOn(memoryCardService, 'finishGame').mockRejectedValue(
        new Error('Connection lost (P1001)')
      );

      const res = await request(app)
        .post('/api/memory-card/finish')
        .send(mockFinishMemoryInput);

      expect(res.status).toBe(500);
    });
  });
});
