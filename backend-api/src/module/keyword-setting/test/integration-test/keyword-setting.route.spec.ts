import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { keywordRouter } from '../../keyword-setting.route.js';
import { errorHandler } from '../../../../shared/http/error-handler.js';
import { keywordSettingService } from '../../keyword-setting.service.js';

vi.mock('../../../../middleware/authenticate.middleware.js', () => ({
  Authenticate: (req: any, _res: any, next: any) => {
    req.user = { userId: 1, role: 'admin' };
    next();
  },
}));

vi.mock('../../../../middleware/authorize.middleware.js', () => ({
  authorize: () => (_req: any, _res: any, next: any) => next(),
}));

describe('Keyword Setting Routes - Integration Tests (QC 10-Year Standard)', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/admin/keywords', keywordRouter);
    app.use(errorHandler);
  });

  describe('1. Happy Cases', () => {
    it('[KWS-IT-01] GET /api/admin/keywords trả về danh sách nhóm từ khóa', async () => {
      vi.spyOn(keywordSettingService, 'getAll').mockReturnValue([
        { id: 'kw-1', group: 'Du lịch', keywords: ['tour', 'hotel'] },
      ]);

      const res = await request(app).get('/api/admin/keywords');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
    });

    it('[KWS-IT-02] POST /api/admin/keywords tạo nhóm từ khóa mới', async () => {
      vi.spyOn(keywordSettingService, 'createGroup').mockReturnValue({
        id: 'kw-2',
        group: 'Khoa học',
        keywords: ['science', 'research'],
      });

      const res = await request(app)
        .post('/api/admin/keywords')
        .send({ group: 'Khoa học', keywords: ['science', 'research'] });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.group).toBe('Khoa học');
    });

    it('[KWS-IT-03] DELETE /api/admin/keywords/:id xóa nhóm từ khóa', async () => {
      vi.spyOn(keywordSettingService, 'deleteGroup').mockReturnValue(true);

      const res = await request(app).delete('/api/admin/keywords/kw-1');

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('thành công');
    });
  });

  describe('2. Bad End Cases', () => {
    it('[KWS-IT-04] POST /api/admin/keywords tạo nhóm trùng tên trả về 400 duplicate', async () => {
      const { ApiError } = await import('../../../../shared/http/api-error.js');
      vi.spyOn(keywordSettingService, 'createGroup').mockImplementation(() => {
        throw new ApiError(400, 'duplicate', 'Nhóm này đã tồn tại');
      });

      const res = await request(app)
        .post('/api/admin/keywords')
        .send({ group: 'Trùng', keywords: ['a'] });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('duplicate');
    });
  });

  describe('3. Concurrency Cases', () => {
    it('[KWS-IT-05] 2 request thêm nhóm song song', async () => {
      vi.spyOn(keywordSettingService, 'createGroup').mockImplementation((g, k) => ({
        id: `kw-${g}`,
        group: g,
        keywords: k,
      }));

      const [r1, r2] = await Promise.all([
        request(app).post('/api/admin/keywords').send({ group: 'G1', keywords: ['a'] }),
        request(app).post('/api/admin/keywords').send({ group: 'G2', keywords: ['b'] }),
      ]);

      expect(r1.status).toBe(201);
      expect(r2.status).toBe(201);
    });
  });
});
