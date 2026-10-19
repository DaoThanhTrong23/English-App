import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StudentManageService } from '../../studentManage.service.js';
import { mockStudentEntity } from '../data-mock/studentManage.mock.js';
import { ApiError } from '../../../../shared/http/api-error.js';
import { prisma } from '../../../../config/prisma.js';

vi.mock('../../../../config/prisma.js', () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    refreshToken: {
      deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
    },
  },
}));

vi.mock('../../notification/notification.service.js', () => ({
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

      const res = await service.getStudentslist({ page: 1, limit: 10 });

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

      const res = await service.updateStudentLockStatus(10, true);

      expect(res.isLocked).toBe(true);
      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({ where: { userId: 10 } });
    });
  });

  describe('2. Bad End Cases', () => {
    it('[STM-02] Khóa tài khoản không tồn tại ném lỗi 404', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

      await expect(service.updateStudentLockStatus(9999, true)).rejects.toThrowError(
        expect.objectContaining({ statuscode: 404 })
      );
    });
  });

  describe('3. Concurrency Cases', () => {
    it('[STM-03] Nhiều Admin cập nhật trạng thái khóa đồng thời', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue({ id: 10, role: 'user' } as any);
      vi.mocked(prisma.user.update).mockResolvedValue({ id: 10, isLocked: false } as any);

      const p1 = service.updateStudentLockStatus(10, false);
      const p2 = service.updateStudentLockStatus(10, false);

      await Promise.all([p1, p2]);
      expect(prisma.user.update).toHaveBeenCalledTimes(2);
    });
  });

  describe('4. Data Conflict & Network Failures', () => {
    it('[STM-05] Mất kết nối DB khi truy vấn danh sách học viên ném lỗi 500', async () => {
      mockRepo.findStudentsWithPagination.mockRejectedValue(new Error('Connection lost (P1001)'));

      await expect(service.getStudentslist({ page: 1, limit: 10 })).rejects.toThrow('Connection lost');
    });
  });
});
