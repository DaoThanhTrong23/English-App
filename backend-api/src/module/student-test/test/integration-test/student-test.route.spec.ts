import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { studentTestRouter } from '../../student-test.route.js';
import { errorHandler } from '../../../../shared/http/error-handler.js';
import { studentTestService } from '../../student-test.service.js';
import { mockStudentTest, mockTestSubmission } from '../data-mock/student-test.mock.js';
import { ApiError } from '../../../../shared/http/api-error.js';

vi.mock('../../../../middleware/authenticate.middleware.js', () => ({
  Authenticate: (req: any, _res: any, next: any) => {
    req.user = { userId: 1, role: 'student' };
    next();
  },
}));

vi.mock('../../../../middleware/authorize.middleware.js', () => ({
  requirePermission: () => (_req: any, _res: any, next: any) => next(),
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

  describe('2. Level & Topic Access Control Cases (Chênh Lệch Trình Độ & Chủ Đề)', () => {
    it('[STT-IT-DISC-01] GET /api/student/tests/:id chênh lệch trình độ (A1 mở bài thi C1) trả về 403 level_mismatch', async () => {
      vi.spyOn(studentTestService, 'getTestDetail').mockRejectedValue(
        new ApiError(403, 'level_mismatch', 'Trình độ hiện tại (A1) không đủ điều kiện làm bài thi cấp độ C1.')
      );

      const res = await request(app).get('/api/student/tests/99');

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('level_mismatch');
    });

    it('[STT-IT-DISC-02] POST /api/student/tests/:id/submit nộp bài thi vượt cấp trình độ trả về 403 level_mismatch', async () => {
      vi.spyOn(studentTestService, 'submitTest').mockRejectedValue(
        new ApiError(403, 'level_mismatch', 'Trình độ hiện tại (A1) không đủ điều kiện làm bài thi cấp độ C1.')
      );

      const res = await request(app)
        .post('/api/student/tests/99/submit')
        .send({ submissions: mockTestSubmission });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('level_mismatch');
    });

    it('[STT-IT-TOPIC-01] GET /api/student/tests/:id mở bài thi của Topic khác chưa đăng ký trả về 403 topic_access_denied', async () => {
      vi.spyOn(studentTestService, 'getTestDetail').mockRejectedValue(
        new ApiError(403, 'topic_access_denied', 'Bạn không thể truy cập bài thi của Topic khác.')
      );

      const res = await request(app).get('/api/student/tests/50');

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('topic_access_denied');
    });

    it('[STT-IT-TOPIC-02] POST /api/student/tests/:id/submit nộp bài thi của Topic khác trả về 403 topic_access_denied', async () => {
      vi.spyOn(studentTestService, 'submitTest').mockRejectedValue(
        new ApiError(403, 'topic_access_denied', 'Bạn không thể truy cập bài thi của Topic khác.')
      );

      const res = await request(app)
        .post('/api/student/tests/50/submit')
        .send({ submissions: mockTestSubmission });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('topic_access_denied');
    });
  });

  describe('3. Bad End Cases', () => {
    it('[STT-IT-03] POST /api/student/tests/:id/submit submissions không phải array trả về 400', async () => {
      const res = await request(app)
        .post('/api/student/tests/1/submit')
        .send({ submissions: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('4. Network Failures', () => {
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
