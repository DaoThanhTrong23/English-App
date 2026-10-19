import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { studentTestRouter } from '../../student-test.route.js';
import { errorHandler } from '../../../../shared/http/error-handler.js';
import { studentTestService } from '../../student-test.service.js';
import { mockStudentTest, mockTestSubmission } from '../data-mock/student-test.mock.js';

vi.mock('../../../../middleware/authenticate.middleware.js', () => ({
  Authenticate: (req: any, _res: any, next: any) => {
    req.user = { userId: 1, role: 'student' };
    next();
  },
}));

describe('Student Test Routes - Integration Tests (QC 10-Year Standard)', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/student/tests', studentTestRouter);
    app.use(errorHandler);
  });

  describe('1. Happy Cases', () => {
    it('[STT-IT-01] GET /api/student/tests/:id lấy chi tiết bài thi', async () => {
      vi.spyOn(studentTestService, 'getTestDetail').mockResolvedValue(mockStudentTest as any);

      const res = await request(app).get('/api/student/tests/1');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(1);
    });

    it('[STT-IT-02] POST /api/student/tests/:id/submit nộp bài thi thành công', async () => {
      vi.spyOn(studentTestService, 'submitTest').mockResolvedValue({
        totalScore: 20,
        correctCount: 2,
        totalQuestions: 2,
        xpGained: 20,
        isRetake: false,
        newElo: { grammar: 1020, vocab: 1020, reading: 1000, listening: 1000 },
      });

      const res = await request(app)
        .post('/api/student/tests/1/submit')
        .send({ submissions: mockTestSubmission });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalScore).toBe(20);
    });
  });

  describe('2. Bad End Cases', () => {
    it('[STT-IT-03] POST /api/student/tests/:id/submit submissions không phải array trả về 400', async () => {
      const res = await request(app)
        .post('/api/student/tests/1/submit')
        .send({ submissions: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('3. Network Failures', () => {
    it('[STT-IT-04] Lỗi database khi nộp bài thi trả về 500', async () => {
      vi.spyOn(studentTestService, 'submitTest').mockRejectedValue(
        new Error('Connection lost (P1001)')
      );

      const res = await request(app)
        .post('/api/student/tests/1/submit')
        .send({ submissions: mockTestSubmission });

      expect(res.status).toBe(500);
    });
  });
});
