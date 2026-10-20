import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import wordMatchingRouter from '../../word-matching.route.js';
import { errorHandler } from '../../../../shared/http/error-handler.js';
import { wordMatchingService } from '../../word-matching.service.js';
import {
  mockSubmitWordMatchingInput,
  mockSaveWordMatchingProgressInput,
} from '../data-mock/word-matching.mock.js';

vi.mock('../../../../middleware/authenticate.middleware.js', () => ({
  Authenticate: (req: any, _res: any, next: any) => {
    req.user = { userId: 1, role: 'student' };
    next();
  },
}));

describe('Word Matching Routes - Integration Tests (QC 10-Year Standard)', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/word-matching', wordMatchingRouter);
    app.use(errorHandler);
  });

  describe('1. Happy Cases', () => {
    it('[WM-IT-01] GET /api/word-matching/start bắt đầu ván chơi nối từ', async () => {
      vi.spyOn(wordMatchingService, 'startGame').mockResolvedValue({
        totalWords: 4,
        columnA: [],
        columnB: [],
      });

      const res = await request(app).get('/api/word-matching/start?limit=4');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalWords).toBe(4);
    });

    it('[WM-IT-02] POST /api/word-matching/submit nộp bài nối từ', async () => {
      vi.spyOn(wordMatchingService, 'submitAnswers').mockResolvedValue({
        totalQuestions: 3,
        correctCount: 2,
        wrongCount: 1,
        score: 20,
        maxScore: 30,
        earnedXp: 10,
        currentXp: 100,
        duration: 30,
        details: [],
      });

      const res = await request(app)
        .post('/api/word-matching/submit')
        .send(mockSubmitWordMatchingInput);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.score).toBe(20);
    });

    it('[WM-IT-03] POST /api/word-matching/progress lưu tiến trình tạm', async () => {
      vi.spyOn(wordMatchingService, 'saveProgress').mockResolvedValue({
        message: 'Lưu tiến trình tạm thời thành công',
        currentMatchedPairs: 2,
        totalPairs: 10,
      });

      const res = await request(app)
        .post('/api/word-matching/progress')
        .send(mockSaveWordMatchingProgressInput);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.currentMatchedPairs).toBe(2);
    });
  });

  describe('2. Validation & Invalid Input Cases', () => {
    it('[WM-IT-04] GET /api/word-matching/start limit < 4 trả về 422', async () => {
      const res = await request(app).get('/api/word-matching/start?limit=2');
      expect(res.status).toBe(422);
    });

    it('[WM-IT-VAL-01] GET /api/word-matching/start limit > 20 trả về 422', async () => {
      const res = await request(app).get('/api/word-matching/start?limit=25');
      expect(res.status).toBe(422);
    });

    it('[WM-IT-VAL-02] GET /api/word-matching/start limit chữ trả về 422', async () => {
      const res = await request(app).get('/api/word-matching/start?limit=xyz');
      expect(res.status).toBe(422);
    });

    it('[WM-IT-VAL-03] GET /api/word-matching/start lessonId <= 0 trả về 422', async () => {
      const res = await request(app).get('/api/word-matching/start?lessonId=-1');
      expect(res.status).toBe(422);
    });

    it('[WM-IT-05] POST /api/word-matching/submit answers rỗng trả về 422', async () => {
      const res = await request(app)
        .post('/api/word-matching/submit')
        .send({ duration: 30, answers: [] });
      expect(res.status).toBe(422);
    });

    it('[WM-IT-VAL-04] POST /api/word-matching/submit duration âm trả về 422', async () => {
      const res = await request(app)
        .post('/api/word-matching/submit')
        .send({ ...mockSubmitWordMatchingInput, duration: -10 });
      expect(res.status).toBe(422);
    });

    it('[WM-IT-VAL-05] POST /api/word-matching/submit answers thiếu selectedMeaningId trả về 422', async () => {
      const res = await request(app)
        .post('/api/word-matching/submit')
        .send({ duration: 30, answers: [{ wordId: 1 }] });
      expect(res.status).toBe(422);
    });

    it('[WM-IT-VAL-06] POST /api/word-matching/submit body rỗng thiếu trường bắt buộc trả về 422', async () => {
      const res = await request(app)
        .post('/api/word-matching/submit')
        .send({});
      expect(res.status).toBe(422);
    });

    it('[WM-IT-VAL-07] POST /api/word-matching/progress currentMatchedPairs âm trả về 422', async () => {
      const res = await request(app)
        .post('/api/word-matching/progress')
        .send({ currentMatchedPairs: -1 });
      expect(res.status).toBe(422);
    });

    it('[WM-IT-VAL-08] POST /api/word-matching/progress totalPairs < 1 trả về 422', async () => {
      const res = await request(app)
        .post('/api/word-matching/progress')
        .send({ totalPairs: 0 });
      expect(res.status).toBe(422);
    });
  });

  describe('3. Concurrency & Network Failures', () => {
    it('[WM-IT-CONF-01] POST /api/word-matching/submit xử lý 2 request nộp bài gửi đồng thời an toàn', async () => {
      vi.spyOn(wordMatchingService, 'submitAnswers')
        .mockResolvedValueOnce({
          totalQuestions: 3,
          correctCount: 2,
          wrongCount: 1,
          score: 20,
          maxScore: 30,
          earnedXp: 10,
          currentXp: 100,
          duration: 30,
          details: [],
        })
        .mockResolvedValueOnce({
          totalQuestions: 3,
          correctCount: 2,
          wrongCount: 1,
          score: 20,
          maxScore: 30,
          earnedXp: 10,
          currentXp: 100,
          duration: 30,
          details: [],
        });

      const [res1, res2] = await Promise.all([
        request(app).post('/api/word-matching/submit').send(mockSubmitWordMatchingInput),
        request(app).post('/api/word-matching/submit').send(mockSubmitWordMatchingInput),
      ]);

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res1.body.data.score).toBe(20);
      expect(res2.body.data.score).toBe(20);
    });

    it('[WM-IT-06] Lỗi database khi nộp bài trả về 500', async () => {
      vi.spyOn(wordMatchingService, 'submitAnswers').mockRejectedValue(
        new Error('Connection lost (P1001)')
      );

      const res = await request(app)
        .post('/api/word-matching/submit')
        .send(mockSubmitWordMatchingInput);

      expect(res.status).toBe(500);
    });
  });
});
