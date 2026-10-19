import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { studentManageRouter } from '../../studenManage.route.js';
import { errorHandler } from '../../../../shared/http/error-handler.js';
import { studentManageService } from '../../studentManage.service.js';
import { ApiError } from '../../../../shared/http/api-error.js';

let currentUser: any = { userId: 1, role: 'admin' };

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

describe('StudentManage Routes - Integration Tests (QC 10-Year Standard)', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    currentUser = { userId: 1, role: 'admin' };
    app = express();
    app.use(express.json());
    app.use('/api/admin/students', studentManageRouter);
    app.use(errorHandler);
  });

  describe('1. Phân Quyền & Xác Thực (Authorization & Authentication)', () => {
    it('[STM-IT-AUTH-01] GET /api/admin/students: Học viên (role: user) truy cập danh sách bị chặn 403 Forbidden', async () => {
      currentUser = { userId: 2, role: 'user' };

      const res = await request(app).get('/api/admin/students');

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('forbidden');
      expect(res.body.message).toContain('Bạn không có quyền');
    });

    it('[STM-IT-AUTH-02] GET /api/admin/students/totalStudent: Học viên (role: user) xem tổng số học viên bị chặn 403 Forbidden', async () => {
      currentUser = { userId: 2, role: 'user' };

      const res = await request(app).get('/api/admin/students/totalStudent');

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('forbidden');
    });

    it('[STM-IT-AUTH-03] GET /api/admin/students/top: Học viên (role: user) xem danh sách top học viên bị chặn 403 Forbidden', async () => {
      currentUser = { userId: 2, role: 'user' };

      const res = await request(app).get('/api/admin/students/top');

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('forbidden');
    });

    it('[STM-IT-AUTH-04] GET /api/admin/students/:id: Học viên (role: user) xem chi tiết hồ sơ người khác bị chặn 403 Forbidden', async () => {
      currentUser = { userId: 2, role: 'user' };

      const res = await request(app).get('/api/admin/students/10');

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('forbidden');
    });

    it('[STM-IT-AUTH-05] GET /api/admin/students/:id/progress: Học viên (role: user) xem tiến độ từ vựng người khác bị chặn 403 Forbidden', async () => {
      currentUser = { userId: 2, role: 'user' };

      const res = await request(app).get('/api/admin/students/10/progress');

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('forbidden');
    });

    it('[STM-IT-AUTH-06] GET /api/admin/students/:id/ai-chat: Học viên (role: user) xem lịch sử chat AI người khác bị chặn 403 Forbidden', async () => {
      currentUser = { userId: 2, role: 'user' };

      const res = await request(app).get('/api/admin/students/10/ai-chat');

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('forbidden');
    });

    it('[STM-IT-AUTH-07] PATCH /api/admin/students/:id/status: Học viên cố tình khóa tài khoản bị chặn 403 Forbidden', async () => {
      currentUser = { userId: 2, role: 'user' };

      const res = await request(app)
        .patch('/api/admin/students/10/status')
        .send({ isLocked: true });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('forbidden');
    });

    it('[STM-IT-AUTH-08] GET /api/admin/students: Request không gửi Token xác thực trả về 401 Unauthorized', async () => {
      currentUser = null;

      const res = await request(app).get('/api/admin/students');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('unauthorized');
    });

    it('[STM-IT-AUTH-09] PATCH /api/admin/students/:id/status: Request không gửi Token xác thực trả về 401 Unauthorized', async () => {
      currentUser = null;

      const res = await request(app)
        .patch('/api/admin/students/10/status')
        .send({ isLocked: true });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('unauthorized');
    });
  });

  describe('2. Happy Cases (Dành cho Admin)', () => {
    it('[STM-IT-01] GET /api/admin/students trả về danh sách học viên', async () => {
      vi.spyOn(studentManageService, 'getStudentslist').mockResolvedValue({
        items: [{ id: 10, username: 'student10' } as any],
        pagination: { currentPage: 1, limit: 10, totalItems: 1, totalPages: 1, hasNextPage: false, hasPrevPage: false },
      });

      const res = await request(app).get('/api/admin/students?page=1&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBe(1);
    });

    it('[STM-IT-02] PATCH /api/admin/students/:id/status cập nhật trạng thái khóa tài khoản', async () => {
      vi.spyOn(studentManageService, 'updateStudentLockStatus').mockResolvedValue({
        id: 10,
        username: 'student10',
        email: 'student10@example.com',
        isLocked: true,
      } as any);

      const res = await request(app)
        .patch('/api/admin/students/10/status')
        .send({ isLocked: true });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Đã khóa tài khoản');
    });
  });

  describe('3. Bad End Cases', () => {
    it('[STM-IT-03] PATCH /api/admin/students/:id/status thiếu isLocked trả về 422', async () => {
      const res = await request(app)
        .patch('/api/admin/students/10/status')
        .send({});

      expect(res.status).toBe(422);
    });

    it('[STM-IT-04] GET /api/admin/students/abc id không phải số trả về 422', async () => {
      const res = await request(app).get('/api/admin/students/abc');

      expect(res.status).toBe(422);
    });
  });

  describe('4. Đụng độ Đồng Thời (Update vs Delete Concurrency)', () => {
    it('[STM-IT-RACE-01] Đụng độ Cập nhật & Xóa đồng thời: 1 request thành công, 1 request gặp tài khoản đã xóa trả về 404', async () => {
      // Giả lập 2 request song song: Request 1 update thành công, Request 2 update trên tài khoản vừa bị xóa đồng thời ném 404
      vi.spyOn(studentManageService, 'updateStudentLockStatus')
        .mockResolvedValueOnce({ id: 10, username: 'student10', email: 's@ex.com', isLocked: true } as any)
        .mockRejectedValueOnce(new ApiError(404, 'student_not_found', 'Không tìm thấy học viên'));

      const [r1, r2] = await Promise.all([
        request(app).patch('/api/admin/students/10/status').send({ isLocked: true }),
        request(app).patch('/api/admin/students/10/status').send({ isLocked: true }),
      ]);

      expect(r1.status).toBe(200);
      expect(r1.body.success).toBe(true);
      expect(r2.status).toBe(404);
      expect(r2.body.error.code).toBe('student_not_found');
    });

    it('[STM-IT-RACE-02] Gửi 2 request thay đổi trạng thái khóa học viên đồng thời', async () => {
      vi.spyOn(studentManageService, 'updateStudentLockStatus').mockResolvedValue({ id: 10, isLocked: false } as any);

      const [r1, r2] = await Promise.all([
        request(app).patch('/api/admin/students/10/status').send({ isLocked: false }),
        request(app).patch('/api/admin/students/10/status').send({ isLocked: false }),
      ]);

      expect(r1.status).toBe(200);
      expect(r2.status).toBe(200);
    });

    it('[STM-IT-RACE-03] Đụng độ Update tới trước - Delete xen ngang: Cập nhật không làm vô hiệu hóa kết quả xóa', async () => {
      let isStudentDeleted = false;

      vi.spyOn(studentManageService, 'updateStudentLockStatus').mockImplementation(async () => {
        // Giả lập độ trễ khi update đang chạy thì lệnh xóa xen vào giữa luồng
        await new Promise((r) => setTimeout(r, 25));
        if (isStudentDeleted) {
          throw new ApiError(404, 'student_not_found', 'Học viên đã bị xóa bởi thao tác xóa đồng thời');
        }
        return { id: 10, username: 'student10', isLocked: true } as any;
      });

      // 1. Request Cập nhật tới trước và bắt đầu xử lý
      const updateReq = request(app).patch('/api/admin/students/10/status').send({ isLocked: true });

      // 2. Lệnh Xóa xen ngang vào giữa khi update chưa kết thúc
      setTimeout(() => {
        isStudentDeleted = true;
      }, 5);

      const res = await updateReq;

      // 3. Kết quả: Update bị hủy bỏ an toàn với 404, không ghi đè làm mất hiệu lực việc xóa
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('student_not_found');
      expect(isStudentDeleted).toBe(true);
    });
  });

  describe('5. Data Conflict & Network Failures', () => {
    it('[STM-IT-05] Mất kết nối DB khi lấy danh sách học viên trả về 500', async () => {
      vi.spyOn(studentManageService, 'getStudentslist').mockRejectedValue(new Error('Connection lost (P1001)'));

      const res = await request(app).get('/api/admin/students?page=1&limit=10');

      expect(res.status).toBe(500);
    });
  });
});
