import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { studentVocabularyRouter } from '../../student-vocabulary.route.js';
import { errorHandler } from '../../../../shared/http/error-handler.js';
import { studentVocabularyService } from '../../student-vocabulary.service.js';

vi.mock('../../../../middleware/authenticate.middleware.js', () => ({
  Authenticate: (req: any, _res: any, next: any) => {
    req.user = { userId: 1, role: 'user' };
    next();
  },
}));

describe('Student Vocabulary Routes - Integration Tests (QC 10-Year Standard)', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/student/vocabulary', studentVocabularyRouter);
    app.use(errorHandler);
  });

  describe('1. Happy Cases', () => {
    it('[STV-IT-01] GET /api/student/vocabulary trả về 200 kèm danh sách từ vựng', async () => {
      vi.spyOn(studentVocabularyService, 'getVocabularyList').mockResolvedValue({
        items: [{ id: 1, wordId: 10, status: 'new' } as any],
        pagination: { limit: 10, nextCursor: null, hasMore: false, totalItems: 1 },
      });

      const res = await request(app).get('/api/student/vocabulary');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBe(1);
    });

    it('[STV-IT-02] POST /api/student/vocabulary thêm từ vựng thành công', async () => {
      vi.spyOn(studentVocabularyService, 'addVocabulary').mockResolvedValue({
        id: 1,
        userId: 1,
        wordId: 10,
        status: 'new',
      } as any);

      const res = await request(app)
        .post('/api/student/vocabulary')
        .send({ wordId: 10 });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.wordId).toBe(10);
    });

    it('[STV-IT-03] POST /api/student/vocabulary/reviews nộp kết quả ôn tập thành công', async () => {
      vi.spyOn(studentVocabularyService, 'submitReview').mockResolvedValue({
        id: 1,
        memoryLevel: 3,
        status: 'learning',
      } as any);

      const res = await request(app)
        .post('/api/student/vocabulary/reviews')
        .send({ wordId: 10, isCorrect: true });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('2. Bad End Cases', () => {
    it('[STV-IT-04] POST /api/student/vocabulary/reviews thiếu wordId trả về 400', async () => {
      const res = await request(app)
        .post('/api/student/vocabulary/reviews')
        .send({ isCorrect: true });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Thiếu wordId hoặc isCorrect');
    });

    it('[STV-IT-05] GET /api/student/vocabulary/999 không tìm thấy trả về 404', async () => {
      const { ApiError } = await import('../../../../shared/http/api-error.js');
      vi.spyOn(studentVocabularyService, 'getVocabularyDetail').mockRejectedValue(
        new ApiError(404, 'vocabulary_not_found', 'Không tìm thấy từ vựng')
      );

      const res = await request(app).get('/api/student/vocabulary/999');

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('vocabulary_not_found');
    });
  });

  describe('3. Concurrency Cases', () => {
    it('[STV-IT-06] Gửi 2 request ôn tập song song', async () => {
      vi.spyOn(studentVocabularyService, 'submitReview').mockResolvedValue({} as any);

      const [r1, r2] = await Promise.all([
        request(app).post('/api/student/vocabulary/reviews').send({ wordId: 10, isCorrect: true }),
        request(app).post('/api/student/vocabulary/reviews').send({ wordId: 11, isCorrect: false }),
      ]);

      expect(r1.status).toBe(200);
      expect(r2.status).toBe(200);
    });
  });

  describe('4. Data Conflict & Network Failures', () => {
    it('[STV-IT-07] Thêm từ đã có sẵn trả về 409 Conflict', async () => {
      const { ApiError } = await import('../../../../shared/http/api-error.js');
      vi.spyOn(studentVocabularyService, 'addVocabulary').mockRejectedValue(
        new ApiError(409, 'word_already_added', 'Từ vựng này đã tồn tại trong danh sách học của bạn')
      );

      const res = await request(app)
        .post('/api/student/vocabulary')
        .send({ wordId: 10 });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('word_already_added');
    });

    it('[STV-IT-08] Mất kết nối DB khi lấy danh sách trả về 500', async () => {
      vi.spyOn(studentVocabularyService, 'getVocabularyList').mockRejectedValue(
        new Error('Database offline (P1001)')
      );

      const res = await request(app).get('/api/student/vocabulary');

      expect(res.status).toBe(500);
    });
  });
});
