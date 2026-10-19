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
    it('[WM-IT-01] GET /api/word-matching/start khởi tạo bàn chơi nối từ', async () => {
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
        earnedXp: 20,
        currentXp: 120,
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
        totalPairs: 4,
      });

      const res = await request(app)
        .post('/api/word-matching/progress')
        .send(mockSaveWordMatchingProgressInput);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.currentMatchedPairs).toBe(2);
    });
  });

  describe('2. Bad End Cases', () => {
    it('[WM-IT-04] POST /api/word-matching/submit answers rỗng trả về 422', async () => {
      const res = await request(app)
        .post('/api/word-matching/submit')
        .send({ duration: 10, answers: [] });

      expect(res.status).toBe(422);
    });

    it('[WM-IT-05] GET /api/word-matching/start limit < 4 trả về 422', async () => {
      const res = await request(app).get('/api/word-matching/start?limit=2');

      expect(res.status).toBe(422);
    });
  });

  describe('3. Network Failures', () => {
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
