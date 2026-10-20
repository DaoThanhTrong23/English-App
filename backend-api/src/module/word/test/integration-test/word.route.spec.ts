import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { wordRouter } from '../../word.route.js';
import { errorHandler } from '../../../../shared/http/error-handler.js';
import { wordService } from '../../word.service.js';
import { ApiError } from '../../../../shared/http/api-error.js';

let mockUser: { userId: number; role: string } | null = { userId: 1, role: 'admin' };

vi.mock('../../../../middleware/authenticate.middleware.js', () => ({
  Authenticate: (req: any, res: any, next: any) => {
    if (!mockUser) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    req.user = mockUser;
    next();
  },
}));

vi.mock('../../../../middleware/authorize.middleware.js', () => ({
  authorize: (allowedRoles: string[]) => (req: any, _res: any, next: any) => {
    if (!allowedRoles.includes(req.user?.role)) {
      return next(new ApiError(403, 'forbidden', 'Bạn không có quyền thực hiện hành động này'));
    }
    next();
  },
}));

describe('Word Routes - Integration Tests (QC 10-Year Standard)', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { userId: 1, role: 'admin' };
    app = express();
    app.use(express.json());
    app.use('/api/admin/word', wordRouter);
    app.use(errorHandler);
  });

  describe('1. Happy Cases', () => {
    it('[WRD-IT-01] GET /api/admin/word trả về danh sách từ vựng', async () => {
      vi.spyOn(wordService, 'fetchWords').mockResolvedValue({
        data: [{ id: 1, headword: 'test' } as any],
        meta: { currentPage: 1, totalPages: 1, totalItems: 1 },
      });

      const res = await request(app).get('/api/admin/word');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
    });

    it('[WRD-IT-02] POST /api/admin/word tạo từ vựng mới', async () => {
      vi.spyOn(wordService, 'createWord').mockResolvedValue({
        id: 1,
        headword: 'test',
        partOfSpeech: 'noun',
      } as any);

      const res = await request(app)
        .post('/api/admin/word')
        .send({ headword: 'test', partOfSpeech: 'noun' });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Thêm từ vựng thành công');
    });
  });

  describe('2. Bad End Cases', () => {
    it('[WRD-IT-03] POST /api/admin/word trùng từ vựng trả về 400 word_exists', async () => {
      const { ApiError } = await import('../../../../shared/http/api-error.js');
      vi.spyOn(wordService, 'createWord').mockRejectedValue(
        new ApiError(400, 'word_exists', 'Từ vựng đã tồn tại')
      );

      const res = await request(app)
        .post('/api/admin/word')
        .send({ headword: 'duplicate', partOfSpeech: 'noun' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('word_exists');
    });

    it('[WRD-IT-SEC-01] Học viên role user cố tình tạo từ vựng bị từ chối 403 Forbidden', async () => {
      mockUser = { userId: 5, role: 'user' };

      const res = await request(app)
        .post('/api/admin/word')
        .send({ headword: 'hackedword', partOfSpeech: 'noun' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('forbidden');
    });

    it('[WRD-IT-SEC-02] Học viên role user cố tình xóa từ vựng bị từ chối 403 Forbidden', async () => {
      mockUser = { userId: 5, role: 'user' };

      const res = await request(app).delete('/api/admin/word/1');

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('forbidden');
    });

    it('[WRD-IT-SEC-03] Chưa đăng nhập truy cập quản trị từ vựng trả về 401 Unauthorized', async () => {
      mockUser = null;

      const res = await request(app).get('/api/admin/word');

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Unauthorized');
    });

    it('[WRD-IT-SEC-04] Thử SQL Injection qua query param search (?search=\' OR 1=1 --)', async () => {
      const spy = vi.spyOn(wordService, 'fetchWords').mockResolvedValue({
        data: [],
        meta: { currentPage: 1, totalPages: 0, totalItems: 0 },
      });

      const res = await request(app).get('/api/admin/word?search=\' OR 1=1 --');

      expect(res.status).toBe(200);
      expect(spy).toHaveBeenCalledWith(1, 20, undefined, "' OR 1=1 --");
    });
  });

  describe('3. Network Failures', () => {
    it('[WRD-IT-04] Mất kết nối DB khi lấy danh sách từ trả về 500', async () => {
      vi.spyOn(wordService, 'fetchWords').mockRejectedValue(new Error('Connection lost (P1001)'));

      const res = await request(app).get('/api/admin/word');

      expect(res.status).toBe(500);
    });
  });
});
