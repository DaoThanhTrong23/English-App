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

    it('[STV-IT-03B] GET /api/student/vocabulary/reviews/due lấy danh sách từ cần ôn tập thành công', async () => {
      vi.spyOn(studentVocabularyService, 'getDueReviews').mockResolvedValue([
        { wordId: 10, word: 'apple', phonetic: '/ˈæp.əl/', memoryLevel: 1, nextReviewAt: new Date() } as any,
      ]);

      const res = await request(app).get('/api/student/vocabulary/reviews/due');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
    });

    it('[STV-IT-TOG-01] POST /api/student/vocabulary/toggle lưu từ vựng thành công (isSaved = true)', async () => {
      vi.spyOn(studentVocabularyService, 'toggleVocabulary').mockResolvedValue({
        isSaved: true,
        wordId: 10,
        message: 'Đã lưu từ vựng vào sổ tay',
        data: { id: 1, userId: 1, wordId: 10, isSaved: true } as any,
      });

      const res = await request(app)
        .post('/api/student/vocabulary/toggle')
        .send({ wordId: 10 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isSaved).toBe(true);
      expect(res.body.message).toContain('Đã lưu');
    });

    it('[STV-IT-TOG-02] POST /api/student/vocabulary/toggle bỏ lưu từ vựng thành công (isSaved = false)', async () => {
      vi.spyOn(studentVocabularyService, 'toggleVocabulary').mockResolvedValue({
        isSaved: false,
        wordId: 10,
        message: 'Đã bỏ lưu từ vựng khỏi sổ tay',
        data: { id: 1, userId: 1, wordId: 10, isSaved: false } as any,
      });

      const res = await request(app)
        .post('/api/student/vocabulary/toggle')
        .send({ wordId: 10 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isSaved).toBe(false);
      expect(res.body.message).toContain('bỏ lưu');
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

    it('[STV-IT-04B] POST /api/student/vocabulary/toggle thiếu wordId trả về 400', async () => {
      const res = await request(app)
        .post('/api/student/vocabulary/toggle')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Vui lòng cung cấp wordId');
    });

    it('[STV-IT-04C] POST /api/student/vocabulary/toggle từ vựng không tồn tại trả về 404', async () => {
      const { ApiError } = await import('../../../../shared/http/api-error.js');
      vi.spyOn(studentVocabularyService, 'toggleVocabulary').mockRejectedValue(
        new ApiError(404, 'word_not_found', 'Từ vựng không tồn tại')
      );

      const res = await request(app)
        .post('/api/student/vocabulary/toggle')
        .send({ wordId: 99999 });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('word_not_found');
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

    it('[STV-IT-IDOR-01] Chống IDOR: User A cố tình sửa từ vựng thuộc sổ tay của User B trả về 404', async () => {
      const { ApiError } = await import('../../../../shared/http/api-error.js');
      vi.spyOn(studentVocabularyService, 'updateVocabulary').mockRejectedValue(
        new ApiError(404, 'vocabulary_not_found', 'Không tìm thấy từ vựng trong danh sách của bạn hoặc bạn không có quyền cập nhật')
      );

      const res = await request(app)
        .put('/api/student/vocabulary/99')
        .send({ status: 'mastered', memoryLevel: 5 });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('vocabulary_not_found');
    });

    it('[STV-IT-IDOR-02] Chống IDOR: User A cố tình xóa từ vựng thuộc sổ tay của User B trả về 404', async () => {
      const { ApiError } = await import('../../../../shared/http/api-error.js');
      vi.spyOn(studentVocabularyService, 'deleteVocabulary').mockRejectedValue(
        new ApiError(404, 'vocabulary_not_found', 'Không tìm thấy từ vựng trong danh sách của bạn hoặc bạn không có quyền xóa')
      );

      const res = await request(app).delete('/api/student/vocabulary/99');

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('vocabulary_not_found');
    });

    it('[STV-IT-IDOR-03] Chống IDOR: User A gửi payload chứa userId=2 để toggle bookmark cho User B', async () => {
      const spy = vi.spyOn(studentVocabularyService, 'toggleVocabulary').mockResolvedValue({
        isSaved: true,
        wordId: 10,
        message: 'Đã lưu',
      });

      const res = await request(app)
        .post('/api/student/vocabulary/toggle')
        .send({ wordId: 10, userId: 2 });

      expect(res.status).toBe(200);
      // Route phải bỏ qua userId: 2 và chỉ gọi toggle cho User A (userId = 1)
      expect(spy).toHaveBeenCalledWith(1, 10);
    });

    it('[STV-IT-IDOR-04] Chống IDOR: User A gửi ?userId=2 để xem trộm sổ tay từ vựng của User B', async () => {
      const spy = vi.spyOn(studentVocabularyService, 'getVocabularyList').mockResolvedValue({
        items: [],
        pagination: { limit: 10, nextCursor: null, hasMore: false, totalItems: 0 },
      });

      const res = await request(app).get('/api/student/vocabulary?userId=2');

      expect(res.status).toBe(200);
      // Route bắt buộc dùng userId = 1 từ session, không để lộ dữ liệu User B
      expect(spy).toHaveBeenCalledWith(1, expect.any(Object));
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

    it('[STV-IT-CON-02] Gửi 2 request toggle song song cùng wordId', async () => {
      vi.spyOn(studentVocabularyService, 'toggleVocabulary')
        .mockResolvedValueOnce({ isSaved: true, wordId: 10, message: 'Đã lưu' })
        .mockResolvedValueOnce({ isSaved: false, wordId: 10, message: 'Đã bỏ lưu' });

      const [r1, r2] = await Promise.all([
        request(app).post('/api/student/vocabulary/toggle').send({ wordId: 10 }),
        request(app).post('/api/student/vocabulary/toggle').send({ wordId: 10 }),
      ]);

      expect(r1.status).toBe(200);
      expect(r2.status).toBe(200);
      expect(r1.body.data.isSaved).not.toBe(r2.body.data.isSaved);
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

    it('[STV-IT-NET-01] Mất kết nối DB khi lấy reviews/due trả về 500', async () => {
      vi.spyOn(studentVocabularyService, 'getDueReviews').mockRejectedValue(
        new Error('Database offline (P1001)')
      );

      const res = await request(app).get('/api/student/vocabulary/reviews/due');

      expect(res.status).toBe(500);
    });

    it('[STV-IT-NET-02] Lỗi hệ thống khi toggle từ vựng trả về 500', async () => {
      vi.spyOn(studentVocabularyService, 'toggleVocabulary').mockRejectedValue(
        new Error('DB transaction error')
      );

      const res = await request(app)
        .post('/api/student/vocabulary/toggle')
        .send({ wordId: 10 });

      expect(res.status).toBe(500);
    });
  });
});
