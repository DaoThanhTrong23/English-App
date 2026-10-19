import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { onboardingRouter } from '../../onboarding.route.js';
import { errorHandler } from '../../../../shared/http/error-handler.js';
import { onboardingService } from '../../onboarding.service.js';

vi.mock('../../../../middleware/authenticate.middleware.js', () => ({
  Authenticate: (req: any, _res: any, next: any) => {
    req.user = { userId: 1, role: 'user' };
    next();
  },
}));

describe('Onboarding Routes - Integration Tests (QC 10-Year Standard)', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/onboarding', onboardingRouter);
    app.use(errorHandler);
  });

  describe('1. Happy Cases', () => {
    it('[ONB-IT-01] GET /api/onboarding/placement-test trả về 200 kèm danh sách câu hỏi', async () => {
      vi.spyOn(onboardingService, 'getPlacementQuestions').mockResolvedValue([
        { id: 'q1', question: 'Test Q1', options: ['A', 'B'], skillCategory: 'Grammar', topic: 'General', cefr: 'A1', audioText: null },
      ]);

      const res = await request(app).get('/api/onboarding/placement-test');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
    });

    it('[ONB-IT-02] POST /api/onboarding/submit hoàn tất Onboarding thành công', async () => {
      vi.spyOn(onboardingService, 'processOnboarding').mockResolvedValue({
        cefrLevel: 'B2',
        eloProfile: { Grammar: 1400, Vocabulary: 1350, Reading: 1420, Listening: 1300 },
        score: '10/10',
        stoppedEarly: false,
        questionsUsed: 10,
        recommendedCourses: [],
      } as any);

      const res = await request(app)
        .post('/api/onboarding/submit')
        .send({
          job: 'Designer',
          interests: 'Art',
          answers: [{ id: 'q1', answer: 'A', timeTakenMs: 2000 }],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.cefrLevel).toBe('B2');
    });

    it('[ONB-IT-03] POST /api/onboarding/check-progress kiểm tra điều kiện dừng sớm', async () => {
      vi.spyOn(onboardingService, 'checkProgress').mockResolvedValue({ stoppedEarly: false });

      const res = await request(app)
        .post('/api/onboarding/check-progress')
        .send({
          answers: [{ id: 'q1', answer: 'A', timeTakenMs: 2000 }],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.stoppedEarly).toBe(false);
    });
  });

  describe('2. Bad End Cases', () => {
    it('[ONB-IT-04] POST /api/onboarding/submit thiếu answers trả về 400', async () => {
      const res = await request(app)
        .post('/api/onboarding/submit')
        .send({
          job: 'Designer',
          interests: 'Art',
          // thiếu answers
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('invalid_answers');
    });

    it('[ONB-IT-05] POST /api/onboarding/check-progress answers không phải mảng trả về 400', async () => {
      const res = await request(app)
        .post('/api/onboarding/check-progress')
        .send({
          answers: 'not_an_array',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('invalid_answers');
    });
  });

  describe('3. Concurrency Cases', () => {
    it('[ONB-IT-06] Gửi 2 request submit đồng thời đều nhận được phản hồi', async () => {
      vi.spyOn(onboardingService, 'processOnboarding').mockResolvedValue({
        cefrLevel: 'B1',
        eloProfile: { Grammar: 1200, Vocabulary: 1200, Reading: 1200, Listening: 1200 },
        score: '5/5',
        stoppedEarly: false,
        questionsUsed: 5,
        recommendedCourses: [],
      } as any);

      const [r1, r2] = await Promise.all([
        request(app).post('/api/onboarding/submit').send({ job: 'Dev', interests: 'IT', answers: [{ id: '1', answer: 'A' }] }),
        request(app).post('/api/onboarding/submit').send({ job: 'Dev', interests: 'IT', answers: [{ id: '1', answer: 'A' }] }),
      ]);

      expect(r1.status).toBe(200);
      expect(r2.status).toBe(200);
    });
  });

  describe('4. Data Conflict & Network Failures', () => {
    it('[ONB-IT-07] Mất kết nối DB khi processOnboarding trả về 500 lỗi máy chủ', async () => {
      vi.spyOn(onboardingService, 'processOnboarding').mockRejectedValue(new Error('Connection lost (P1001)'));

      const res = await request(app)
        .post('/api/onboarding/submit')
        .send({ job: 'Dev', interests: 'IT', answers: [{ id: '1', answer: 'A' }] });

      expect(res.status).toBe(500);
    });
  });
});
