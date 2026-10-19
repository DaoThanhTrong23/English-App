import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import achievementRouter from '../../achievement.route.js';
import { errorHandler } from '../../../../shared/http/error-handler.js';
import { achievementService } from '../../achievement.service.js';
import { ApiError } from '../../../../shared/http/api-error.js';

let currentUser: any = { id: 1, role: 'admin' };

vi.mock('../../../../middleware/authenticate.middleware.js', () => ({
  Authenticate: (req: any, _res: any, next: any) => {
    if (currentUser) {
      req.user = currentUser;
      next();
    } else {
      next(new ApiError(401, 'unauthorized', 'Thông tin người dùng chưa được xác thực'));
    }
  },
}));

describe('Achievement Routes - Integration Tests (QC 10-Year Standard)', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    currentUser = { id: 1, role: 'admin' };
    app = express();
    app.use(express.json());
    app.use('/api/admin/achievements', achievementRouter);
    app.use(errorHandler);
  });

  describe('1. Phân Quyền & Xác Thực (Authorization & Authentication)', () => {
    it('[ACH-IT-AUTH-01] GET /api/admin/achievements: Học viên (role: user) truy cập bị chặn với HTTP 403 Forbidden', async () => {
      currentUser = { id: 2, role: 'user' };

      const res = await request(app).get('/api/admin/achievements');

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('forbidden');
      expect(res.body.message).toContain('Bạn không có quyền');
    });

    it('[ACH-IT-AUTH-02] POST /api/admin/achievements: Học viên (role: user) tạo danh hiệu bị chặn 403 Forbidden', async () => {
      currentUser = { id: 2, role: 'user' };

      const res = await request(app)
        .post('/api/admin/achievements')
        .send({ title: 'Hack Achievement', requireXp: 10, requireStreak: 1 });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('forbidden');
    });

    it('[ACH-IT-AUTH-03] PUT /api/admin/achievements/:id: Học viên (role: user) sửa danh hiệu bị chặn 403 Forbidden', async () => {
      currentUser = { id: 2, role: 'user' };

      const res = await request(app)
        .put('/api/admin/achievements/1')
        .send({ title: 'Hacked Title' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('forbidden');
    });

    it('[ACH-IT-AUTH-04] DELETE /api/admin/achievements/:id: Học viên (role: user) xóa danh hiệu bị chặn 403 Forbidden', async () => {
      currentUser = { id: 2, role: 'user' };

      const res = await request(app).delete('/api/admin/achievements/1');

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('forbidden');
    });

    it('[ACH-IT-AUTH-05] GET /api/admin/achievements: Request không gửi Token xác thực trả về 401 Unauthorized', async () => {
      currentUser = null;

      const res = await request(app).get('/api/admin/achievements');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('unauthorized');
    });

    it('[ACH-IT-AUTH-06] DELETE /api/admin/achievements/:id: Request không gửi Token xác thực trả về 401 Unauthorized', async () => {
      currentUser = null;

      const res = await request(app).delete('/api/admin/achievements/1');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('unauthorized');
    });
  });

  describe('2. Happy Cases (Dành cho Admin)', () => {
    it('[ACH-IT-01] GET /api/admin/achievements trả về danh sách danh hiệu', async () => {
      vi.spyOn(achievementService, 'getList').mockResolvedValue([
        { id: 1, title: 'Chăm chỉ', requireXp: 100, requireStreak: 3 } as any,
      ]);

      const res = await request(app).get('/api/admin/achievements');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
    });

    it('[ACH-IT-02] POST /api/admin/achievements tạo danh hiệu mới', async () => {
      vi.spyOn(achievementService, 'create').mockResolvedValue({
        id: 2,
        title: 'Bậc thầy',
        requireXp: 1000,
        requireStreak: 30,
      } as any);

      const res = await request(app)
        .post('/api/admin/achievements')
        .send({ title: 'Bậc thầy', requireXp: 1000, requireStreak: 30 });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Bậc thầy');
    });

    it('[ACH-IT-03] DELETE /api/admin/achievements/:id xóa danh hiệu thành công', async () => {
      vi.spyOn(achievementService, 'delete').mockResolvedValue({
        success: true,
        message: 'Xóa danh hiệu thành công',
      });

      const res = await request(app).delete('/api/admin/achievements/1');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('3. Bad End Cases', () => {
    it('[ACH-IT-04] POST /api/admin/achievements thiếu title trả về 422', async () => {
      const res = await request(app)
        .post('/api/admin/achievements')
        .send({ requireXp: 100 });

      expect(res.status).toBe(422);
    });

    it('[ACH-IT-05] PUT /api/admin/achievements/:id với id không phải số trả về 422', async () => {
      const res = await request(app)
        .put('/api/admin/achievements/abc')
        .send({ title: 'Tên mới' });

      expect(res.status).toBe(422);
    });
  });

  describe('4. Đụng Độ Đồng Thời & Race Condition (Update vs Delete Concurrency)', () => {
    it('[ACH-IT-RACE-01] Đụng độ Cập nhật & Xóa đồng thời: 1 request thành công, 1 request gặp danh hiệu đã xóa trả về 404', async () => {
      let isDeleted = false;

      vi.spyOn(achievementService, 'delete').mockImplementation(async () => {
        isDeleted = true;
        return { success: true, message: 'Xóa danh hiệu thành công' };
      });

      vi.spyOn(achievementService, 'update').mockImplementation(async () => {
        if (isDeleted) {
          throw new ApiError(404, 'not_found', 'Không tìm thấy danh hiệu');
        }
        return { id: 10, title: 'Updated' } as any;
      });

      const deleteReq = request(app).delete('/api/admin/achievements/10');
      const updateReq = request(app).put('/api/admin/achievements/10').send({ title: 'Updated' });

      const [resDelete, resUpdate] = await Promise.all([deleteReq, updateReq]);

      expect(resDelete.status).toBe(200);
      expect(resUpdate.status).toBe(404);
      expect(resUpdate.body.error.code).toBe('not_found');
    });

    it('[ACH-IT-RACE-02] Đụng độ Update tới trước - Delete xen ngang: Cập nhật không làm vô hiệu hóa kết quả xóa', async () => {
      let achievementEntity: any = { id: 10, title: 'Title Gốc' };

      vi.spyOn(achievementService, 'update').mockImplementation(async () => {
        if (!achievementEntity) {
          throw new ApiError(404, 'not_found', 'Không tìm thấy danh hiệu');
        }
        achievementEntity.title = 'Title Cập Nhật';
        return achievementEntity;
      });

      // Lệnh xóa xen vào giữa
      achievementEntity = null;

      const res = await request(app)
        .put('/api/admin/achievements/10')
        .send({ title: 'Title Cập Nhật' });

      expect(res.status).toBe(404);
      expect(achievementEntity).toBeNull();
    });

    it('[ACH-IT-RACE-03] Hai Admin cùng gửi request cập nhật cùng một danh hiệu đồng thời', async () => {
      vi.spyOn(achievementService, 'update').mockResolvedValue({ id: 1, title: 'Admin 1 update' } as any);

      const r1 = request(app).put('/api/admin/achievements/1').send({ title: 'Admin 1 update' });
      const r2 = request(app).put('/api/admin/achievements/1').send({ title: 'Admin 2 update' });

      const [res1, res2] = await Promise.all([r1, r2]);

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
    });
  });

  describe('5. Data Conflict & Network Failures', () => {
    it('[ACH-IT-06] Mất kết nối DB khi lấy danh sách trả về 500', async () => {
      vi.spyOn(achievementService, 'getList').mockRejectedValue(new Error('Connection lost (P1001)'));

      const res = await request(app).get('/api/admin/achievements');

      expect(res.status).toBe(500);
    });
  });
});
