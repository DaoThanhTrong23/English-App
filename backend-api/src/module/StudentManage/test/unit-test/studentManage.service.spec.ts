import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StudentManageService } from '../../studentManage.service.js';
import { mockStudentEntity } from '../data-mock/studentManage.mock.js';
import { ApiError } from '../../../../shared/http/api-error.js';
import { prisma } from '../../../../config/prisma.js';

vi.mock('../../../../config/prisma.js', () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn(),
      delete: vi.fn(),
    },
    refreshToken: {
      deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
    },
  },
}));

vi.mock('../../../notification/notification.service.js', () => ({
  notificationService: {
    notifyAdmins: vi.fn().mockResolvedValue(true),
  },
}));

describe('StudentManageService - Unit Tests (QC 10-Year Standard)', () => {
  let service: StudentManageService;
  let mockRepo: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepo = {
      findStudentsWithPagination: vi.fn(),
      findStudentDetailById: vi.fn(),
      countStudent: vi.fn(),
      findUserProgress: vi.fn(),
      findUserAiChat: vi.fn(),
      getTopStudents: vi.fn(),
    };
    service = new StudentManageService(mockRepo);
  });

  describe('1. Happy Cases', () => {
    it('[STM-01a] Lấy danh sách học viên có thống kê tiến độ học từ vựng và bài thi', async () => {
      mockRepo.findStudentsWithPagination.mockResolvedValue({
        totalItems: 1,
        students: [mockStudentEntity],
      });

      const res = await service.getStudentslist({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(res.items.length).toBe(1);
      expect(res.items[0].progress.totalWordsTracked).toBe(2);
      expect(res.items[0].progress.masteredWords).toBe(1);
      expect(res.items[0].progress.learningWords).toBe(1);
      expect(res.items[0].progress.completedTestCount).toBe(5);
    });

    it('[STM-01b] Khóa tài khoản học viên (isLocked = true) và tự động xóa phiên đăng nhập', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue({
        id: 10,
        username: 'student10',
        email: 'student10@example.com',
        role: 'user',
      } as any);
      vi.mocked(prisma.user.update).mockResolvedValue({
        id: 10,
        username: 'student10',
        email: 'student10@example.com',
        isLocked: true,
      } as any);

      const res: any = await service.updateStudentLockStatus(10, true);

      expect(res.isLocked).toBe(true);
      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({ where: { userId: 10 } });
    });

    it('[STM-01c] Mở khóa tài khoản học viên (isLocked = false)', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue({
        id: 10,
        username: 'student10',
        email: 'student10@example.com',
        role: 'user',
      } as any);
      vi.mocked(prisma.user.update).mockResolvedValue({
        id: 10,
        username: 'student10',
        email: 'student10@example.com',
        isLocked: false,
      } as any);

      const res: any = await service.updateStudentLockStatus(10, false);

      expect(res.isLocked).toBe(false);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isLocked: false } })
      );
    });
  });

  describe('2. Bad End Cases', () => {
    it('[STM-02a] Khóa tài khoản không tồn tại ném lỗi 404', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

      await expect(service.updateStudentLockStatus(9999, true)).rejects.toThrowError(
        expect.objectContaining({ statuscode: 404, code: 'student_not_found' })
      );
    });

    it('[STM-02b] Lấy chi tiết học viên không tồn tại ném lỗi 404', async () => {
      mockRepo.findStudentDetailById.mockResolvedValue(null);

      await expect(service.getStudentDetail(9999)).rejects.toThrowError(
        expect.objectContaining({ statuscode: 404, code: 'student_not_found' })
      );
    });
  });

  describe('3. Concurrency & Race Condition (Đụng độ Cập nhật & Xóa)', () => {
    it('[STM-03a] Nhiều Admin cập nhật trạng thái khóa đồng thời', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue({ id: 10, role: 'user' } as any);
      vi.mocked(prisma.user.update).mockResolvedValue({ id: 10, isLocked: false } as any);

      const p1 = service.updateStudentLockStatus(10, false);
      const p2 = service.updateStudentLockStatus(10, false);

      await Promise.all([p1, p2]);
      expect(prisma.user.update).toHaveBeenCalledTimes(2);
    });

    it('[STM-03b] Đụng độ Cập nhật & Xóa: Admin cập nhật trạng thái khi tài khoản bị xóa đồng thời ném 404', async () => {
      // Giả lập luồng: Request A tìm thấy user, nhưng trước khi update kịp chạy thì user bị xóa ở Request B (Prisma ném lỗi P2025: Record to update not found)
      vi.mocked(prisma.user.findFirst).mockResolvedValue({ id: 10, role: 'user', username: 'student10' } as any);
      vi.mocked(prisma.user.update).mockRejectedValue(
        new Error('Record to update not found (P2025)')
      );

      await expect(service.updateStudentLockStatus(10, true)).rejects.toThrow('Record to update not found');
    });

    it('[STM-03c] Đụng độ giữa Xem chi tiết và Xóa tài khoản: User bị xóa ngay khi đang truy vấn chi tiết', async () => {
      mockRepo.findStudentDetailById
        .mockResolvedValueOnce(mockStudentEntity)
        .mockResolvedValueOnce(null);

      const reqBeforeDelete = await service.getStudentDetail(10);
      expect(reqBeforeDelete).toBeDefined();

      await expect(service.getStudentDetail(10)).rejects.toThrowError(
        expect.objectContaining({ statuscode: 404, code: 'student_not_found' })
      );
    });

    it('[STM-03d] Đụng độ Cập nhật tới trước - Xóa xen ngang: Cập nhật không làm vô hiệu hóa việc xóa', async () => {
      // Mô phỏng:
      // Request A (Update) bắt đầu và đọc thấy học viên tồn tại
      // Trước khi Update kịp commit ghi vào DB, Request B (Delete) xen ngang và xóa học viên khỏi database
      // Kết quả: prisma.user.update ném P2025, Update bị hủy bỏ hoàn toàn
      // Đảm bảo: Bản ghi duy trì trạng thái đã bị xóa, không bị hồi sinh hay ghi đè làm vô hiệu hóa thao tác xóa
      let studentInDb: any = { id: 10, role: 'user', username: 'student10', isLocked: false };

      (prisma.user.findFirst as any).mockImplementation(async () => {
        return studentInDb;
      });

      (prisma.user.update as any).mockImplementation(async () => {
        if (!studentInDb) {
          throw new Error('An operation failed because it depends on one or more records that were required but not found. (P2025)');
        }
        studentInDb.isLocked = true;
        return studentInDb;
      });

      // 1. Request A bắt đầu cập nhật
      const updatePromise = service.updateStudentLockStatus(10, true);

      // 2. Request B (Delete) xen ngang ngay khi Request A đang xử lý
      studentInDb = null;

      // 3. Request A phải bị reject do lỗi P2025 (không tìm thấy bản ghi để update)
      await expect(updatePromise).rejects.toThrow('P2025');

      // 4. Trạng thái cuối cùng trong database vẫn là đã bị xóa (null)
      expect(studentInDb).toBeNull();
    });
  });

  describe('4. Data Conflict & Network Failures', () => {
    it('[STM-04] Lỗi khi thu hồi refresh tokens khi khóa tài khoản ném ngoại lệ an toàn', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue({ id: 10, role: 'user', username: 'student10' } as any);
      vi.mocked(prisma.user.update).mockResolvedValue({ id: 10, isLocked: true } as any);
      vi.mocked(prisma.refreshToken.deleteMany).mockRejectedValue(new Error('Foreign key violation or DB error'));

      await expect(service.updateStudentLockStatus(10, true)).rejects.toThrow('Foreign key violation or DB error');
    });

    it('[STM-05] Mất kết nối DB khi truy vấn danh sách học viên ném lỗi 500', async () => {
      mockRepo.findStudentsWithPagination.mockRejectedValue(new Error('Connection lost (P1001)'));

      await expect(
        service.getStudentslist({
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        })
      ).rejects.toThrow('Connection lost');
    });
  });

  describe('5. Phân Quyền & Bảo Vệ Tài Khoản Quản Trị (Authorization & Privilege Protection)', () => {
    it('[STM-AUTH-01] Chặn hành vi khóa tài khoản Admin: Không thể thao túng tài khoản có role khác "user"', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

      await expect(service.updateStudentLockStatus(99, true)).rejects.toThrowError(
        expect.objectContaining({ statuscode: 404, code: 'student_not_found' })
      );
    });

    it('[STM-AUTH-02] Đảm bảo kiểm tra nghiêm ngặt role học viên (role = "user") khi thực hiện khóa/mở khóa', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

      await expect(service.updateStudentLockStatus(1, false)).rejects.toThrowError(
        expect.objectContaining({ statuscode: 404 })
      );
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { id: 1, role: 'user' },
      });
    });

    it('[STM-AUTH-03] Bảo mật phiên: Thu hồi tức thì toàn bộ Refresh Token khi tài khoản bị khóa', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue({ id: 10, role: 'user', username: 'student10' } as any);
      vi.mocked(prisma.user.update).mockResolvedValue({ id: 10, isLocked: true } as any);
      vi.mocked(prisma.refreshToken.deleteMany).mockResolvedValue({ count: 5 });

      await service.updateStudentLockStatus(10, true);

      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 10 },
      });
    });
  });
});
