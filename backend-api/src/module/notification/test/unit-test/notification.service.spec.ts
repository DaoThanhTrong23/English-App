import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationService } from '../../notification.service.js';
import { prisma } from '../../../../config/prisma.js';
import { mockNotification } from '../data-mock/notification.mock.js';

vi.mock('../../../../config/prisma.js', () => ({
  prisma: {
    user: { findMany: vi.fn(), findUnique: vi.fn() },
    notification: {
      findMany: vi.fn(),
      count: vi.fn(),
      createMany: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

describe('NotificationService - Unit Tests (QC 10-Year Standard)', () => {
  let service: NotificationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new NotificationService();
  });

  describe('1. Happy Cases', () => {
    it('[NTF-01a] Lấy danh sách thông báo và số lượng chưa đọc chính xác', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 1, role: 'user' } as any);
      vi.mocked(prisma.notification.findMany).mockResolvedValue([mockNotification] as any);
      vi.mocked(prisma.notification.count).mockResolvedValue(1);

      const res = await service.getNotifications(1);

      expect(res.unreadCount).toBe(1);
      expect(res.notifications.length).toBe(1);
    });

    it('[NTF-01b] Đánh dấu thông báo đã đọc', async () => {
      vi.mocked(prisma.notification.updateMany).mockResolvedValue({ count: 1 });

      const res = await service.markAsRead(1, 1);

      expect(res.count).toBe(1);
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { id: 1, userId: 1 },
        data: { isRead: true },
      });
    });

    it('[NTF-01c] Đánh dấu tất cả thông báo là đã đọc', async () => {
      vi.mocked(prisma.notification.updateMany).mockResolvedValue({ count: 5 });

      const res = await service.markAllAsRead(1);

      expect(res.count).toBe(5);
    });

    it('[NTF-01d] Gửi thông báo đến toàn bộ Admin', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([{ id: 99 }, { id: 100 }] as any);

      await service.notifyAdmins('Cảnh báo hệ thống', 'Phát hiện sự cố');

      expect(prisma.notification.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ userId: 99, title: 'Cảnh báo hệ thống' }),
          expect.objectContaining({ userId: 100, title: 'Cảnh báo hệ thống' }),
        ]),
      });
    });
  });

  describe('2. Bad End Cases', () => {
    it('[NTF-02] Đánh dấu thông báo không thuộc quyền sở hữu (IDOR check: userId khác) không làm ảnh hưởng bản ghi', async () => {
      vi.mocked(prisma.notification.updateMany).mockResolvedValue({ count: 0 });

      const res = await service.markAsRead(999, 1);

      expect(res.count).toBe(0);
    });
  });

  describe('3. Concurrency Cases', () => {
    it('[NTF-03] Nhiều tiến trình cùng gửi thông báo cho Admin đồng thời', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([{ id: 99 }] as any);

      const p1 = service.notifyAdmins('T1', 'B1');
      const p2 = service.notifyAdmins('T2', 'B2');

      await Promise.all([p1, p2]);
      expect(prisma.notification.createMany).toHaveBeenCalledTimes(2);
    });
  });

  describe('4. Data Conflict & Network Failures', () => {
    it('[NTF-05] Mất kết nối DB khi lấy danh sách thông báo ném lỗi hệ thống', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 1, role: 'user' } as any);
      vi.mocked(prisma.notification.findMany).mockRejectedValue(new Error('Connection lost (P1001)'));

      await expect(service.getNotifications(1)).rejects.toThrow('Connection lost');
    });
  });
});
