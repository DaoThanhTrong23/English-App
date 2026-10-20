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

    it('[AI-IT-GOP-01] POST /api/ai/evaluate-pronunciation chấm phát âm thành công', async () => {
      vi.spyOn(aiService, 'evaluatePronunciationGOP').mockResolvedValue({
        targetWord: 'apple',
        targetIpa: '/ˈæp.əl/',
        spokenText: 'apple',
        overallScore: 92,
        cefrLevel: 'A1',
        details: { vowelAccuracy: 95, consonantAccuracy: 90, stressAccuracy: 90, fluencyScore: 92 },
        phonemeScores: [],
        silentLetterErrors: [],
        explanation: 'Phát âm rất tốt!',
        improvement: { mouthShape: 'Chuẩn', practiceTip: 'Tiếp tục phát huy' },
      });

      const res = await request(app)
        .post('/api/ai/evaluate-pronunciation')
        .field('targetWord', 'apple')
        .attach('audio', Buffer.from('RIFF....WAVEfmt ....data....'), 'test.wav');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.overallScore).toBe(92);
      expect(res.body.data.targetWord).toBe('apple');
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

    it('[AI-IT-GOP-02] POST /api/ai/evaluate-pronunciation thiếu file audio trả về 400', async () => {
      const res = await request(app)
        .post('/api/ai/evaluate-pronunciation')
        .field('targetWord', 'apple');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('missing_file');
    });

    it('[AI-IT-GOP-03] POST /api/ai/evaluate-pronunciation thiếu targetWord trả về 400', async () => {
      const res = await request(app)
        .post('/api/ai/evaluate-pronunciation')
        .attach('audio', Buffer.from('RIFF....WAVEfmt ....data....'), 'test.wav');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('missing_params');
    });

    it('[AI-IT-GOP-04] POST /api/ai/evaluate-pronunciation upload file không phải âm thanh trả về 400', async () => {
      const res = await request(app)
        .post('/api/ai/evaluate-pronunciation')
        .field('targetWord', 'apple')
        .attach('audio', Buffer.from('malicious script or text'), 'evil.exe');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('invalid_file');
    });
  });

  describe('3. Concurrency Cases', () => {
    it('[AI-IT-GOP-CON-01] 2 request chấm phát âm GOP đồng thời', async () => {
      vi.spyOn(aiService, 'evaluatePronunciationGOP').mockResolvedValue({
        targetWord: 'test',
        overallScore: 85,
      } as any);

      const [r1, r2] = await Promise.all([
        request(app)
          .post('/api/ai/evaluate-pronunciation')
          .field('targetWord', 'test')
          .attach('audio', Buffer.from('RIFF....WAVEfmt ....data....'), 'test1.wav'),
        request(app)
          .post('/api/ai/evaluate-pronunciation')
          .field('targetWord', 'test')
          .attach('audio', Buffer.from('RIFF....WAVEfmt ....data....'), 'test2.wav'),
      ]);

      expect(r1.status).toBe(200);
      expect(r2.status).toBe(200);
    });
  });

  describe('4. Network Failures', () => {
    it('[AI-IT-05] Mất kết nối LLM service khi chấm bài trả về 500', async () => {
      vi.spyOn(aiService, 'gradeEssay').mockRejectedValue(new Error('Connection lost (P1001)'));

      const res = await request(app)
        .post('/api/ai/grade-essay')
        .send({ text: 'Valid length paragraph that fails on connection.' });

      expect(res.status).toBe(500);
    });

    it('[AI-IT-GOP-NET-01] Lỗi Whisper/GOP inference khi chấm phát âm trả về 500', async () => {
      vi.spyOn(aiService, 'evaluatePronunciationGOP').mockRejectedValue(
        new Error('Whisper ASR pipeline crashed')
      );

      const res = await request(app)
        .post('/api/ai/evaluate-pronunciation')
        .field('targetWord', 'apple')
        .attach('audio', Buffer.from('RIFF....WAVEfmt ....data....'), 'test.wav');

      expect(res.status).toBe(500);
    });
  });
});
