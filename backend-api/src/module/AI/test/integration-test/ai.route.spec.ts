import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { aiRouter } from '../../ai.router.js';
import { errorHandler } from '../../../../shared/http/error-handler.js';
import { aiService } from '../../ai.service.js';
import { mockEssayEvaluation, mockChatResponse } from '../data-mock/ai.mock.js';

vi.mock('../../../../middleware/authenticate.middleware.js', () => ({
  Authenticate: (req: any, _res: any, next: any) => {
    req.user = { userId: 1, role: 'student' };
    next();
  },
}));

vi.mock('../../../../middleware/authorize.middleware.js', () => ({
  authorize: () => (_req: any, _res: any, next: any) => next(),
}));

describe('AI Routes - Integration Tests (QC 10-Year Standard)', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/ai', aiRouter);
    app.use(errorHandler);
  });

  describe('1. Happy Cases', () => {
    it('[AI-IT-01] POST /api/ai/grade-essay chấm bài viết thành công', async () => {
      vi.spyOn(aiService, 'gradeEssay').mockResolvedValue(mockEssayEvaluation as any);

      const res = await request(app)
        .post('/api/ai/grade-essay')
        .send({ text: 'This is a sample essay for testing AI grading feature.' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.overallScore).toBe(7.5);
    });

    it('[AI-IT-02] POST /api/ai/chat trò chuyện với trợ lý ảo AI', async () => {
      vi.spyOn(aiService, 'chatWithBot').mockResolvedValue(mockChatResponse as any);

      const res = await request(app)
        .post('/api/ai/chat')
        .send({ message: 'Hello AI assistant!' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sessionId).toBe(123);
    });
  });

  describe('2. Bad End Cases', () => {
    it('[AI-IT-03] POST /api/ai/grade-essay văn bản quá ngắn (< 5 ký tự) trả về 422', async () => {
      const res = await request(app)
        .post('/api/ai/grade-essay')
        .send({ text: 'Hi' });

      expect(res.status).toBe(422);
    });

    it('[AI-IT-04] POST /api/ai/chat thiếu message trả về 400', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .send({ message: '' });

      expect(res.status).toBe(400);
    });
  });

  describe('3. Network Failures', () => {
    it('[AI-IT-05] Mất kết nối LLM service khi chấm bài trả về 500', async () => {
      vi.spyOn(aiService, 'gradeEssay').mockRejectedValue(new Error('Connection lost (P1001)'));

      const res = await request(app)
        .post('/api/ai/grade-essay')
        .send({ text: 'Valid length paragraph that fails on connection.' });

      expect(res.status).toBe(500);
    });
  });
});
