import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { testRouter } from '../../test.route.js';
import { errorHandler } from '../../../../shared/http/error-handler.js';
import { testService } from '../../test.service.js';
import { mockTestItem, mockQuestionItem, mockCreateTestInput } from '../data-mock/test.mock.js';

vi.mock('../../../../middleware/authenticate.middleware.js', () => ({
  Authenticate: (req: any, _res: any, next: any) => {
    req.user = { userId: 1, role: 'admin' };
    next();
  },
}));

vi.mock('../../../../middleware/authorize.middleware.js', () => ({
  authorize: () => (_req: any, _res: any, next: any) => next(),
}));

describe('Admin Test Routes - Integration Tests (QC 10-Year Standard)', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/admin/tests', testRouter);
    app.use(errorHandler);
  });

  describe('1. Happy Cases', () => {
    it('[TST-IT-01] GET /api/admin/tests trả về danh sách bài thi', async () => {
      vi.spyOn(testService, 'getAllTests').mockResolvedValue([mockTestItem as any]);

      const res = await request(app).get('/api/admin/tests?ceftLevel=B1');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });

    it('[TST-IT-02] POST /api/admin/tests tạo bài thi mới hợp lệ', async () => {
      vi.spyOn(testService, 'createTest').mockResolvedValue({ id: 2, ...mockCreateTestInput } as any);

      const res = await request(app)
        .post('/api/admin/tests')
        .send(mockCreateTestInput);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(2);
    });

    it('[TST-IT-03] GET /api/admin/tests/:testId/questions lấy câu hỏi bài thi', async () => {
      vi.spyOn(testService, 'getQuestions').mockResolvedValue([mockQuestionItem as any]);

      const res = await request(app).get('/api/admin/tests/1/questions');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });

    it('[TST-IT-04] DELETE /api/admin/tests/:testId xóa bài thi thành công', async () => {
      vi.spyOn(testService, 'deleteTest').mockResolvedValue(mockTestItem as any);

      const res = await request(app).delete('/api/admin/tests/1');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Xoá bài thi thành công');
    });
  });

  describe('2. Bad End Cases', () => {
    it('[TST-IT-05] POST /api/admin/tests thiếu title trả về 422', async () => {
      const res = await request(app)
        .post('/api/admin/tests')
        .send({ lessonId: 10 });

      expect(res.status).toBe(422);
    });

    it('[TST-IT-06] POST /api/admin/tests/upload-media không gửi file trả về 400', async () => {
      const res = await request(app).post('/api/admin/tests/upload-media');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('no_file');
    });
  });

  describe('3. Network & System Failures', () => {
    it('[TST-IT-07] Mất kết nối database khi gọi danh sách trả về 500', async () => {
      vi.spyOn(testService, 'getAllTests').mockRejectedValue(new Error('Connection lost (P1001)'));

      const res = await request(app).get('/api/admin/tests');

      expect(res.status).toBe(500);
    });
  });
});
