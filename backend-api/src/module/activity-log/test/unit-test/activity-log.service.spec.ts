import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActivityLogService } from '../../activity-log.service.js';
import { activityLogRepository } from '../../activity-log.repository.js';
import { mockActivityItem, mockLoginLogItem } from '../data-mock/activity-log.mock.js';

vi.mock('../../activity-log.repository.js', () => ({
  activityLogRepository: {
    findActivities: vi.fn(),
    findLoginLogs: vi.fn(),
  },
}));

describe('ActivityLogService - Unit Tests (QC 10-Year Standard)', () => {
  let service: ActivityLogService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ActivityLogService();
  });

  describe('1. Happy Cases', () => {
    it('[LOG-01a] Lấy danh sách lịch sử hoạt động có phân trang', async () => {
      vi.mocked(activityLogRepository.findActivities).mockResolvedValue({
        total: 1,
        items: [mockActivityItem as any],
      });

      const res = await service.getActivities(1, 20);

      expect(res.items.length).toBe(1);
      expect(res.pagination.totalItems).toBe(1);
      expect(res.items[0].actionType).toBe('USER_LOGIN');
    });

    it('[LOG-01b] Lấy danh sách lịch sử đăng nhập có phân trang', async () => {
      vi.mocked(activityLogRepository.findLoginLogs).mockResolvedValue({
        total: 1,
        items: [mockLoginLogItem as any],
      });

      const res = await service.getLoginLogs(1, 20);

      expect(res.items.length).toBe(1);
      expect(res.pagination.totalItems).toBe(1);
      expect(res.items[0].ipAddress).toBe('127.0.0.1');
    });
  });

  describe('2. Bad End Cases', () => {
    it('[LOG-02] Tìm kiếm không có kết quả trả về mảng rỗng và totalItems = 0', async () => {
      vi.mocked(activityLogRepository.findActivities).mockResolvedValue({
        total: 0,
        items: [],
      });

      const res = await service.getActivities(1, 20, 'unknown_keyword');

      expect(res.items).toHaveLength(0);
      expect(res.pagination.totalItems).toBe(0);
      expect(res.pagination.totalPages).toBe(1);
    });
  });

  describe('3. Phân Quyền & Bảo Vệ Dữ Liệu Nhật Ký (Authorization & Audit Security)', () => {
    it('[LOG-AUTH-01] Bảo mật dữ liệu: Lọc nhật ký hoạt động theo actionType và phân quyền quản trị viên', async () => {
      vi.mocked(activityLogRepository.findActivities).mockResolvedValue({
        total: 1,
        items: [mockActivityItem as any],
      });

      const res = await service.getActivities(1, 20, undefined, 'ADMIN_UPDATE');

      expect(res.items.length).toBe(1);
      expect(activityLogRepository.findActivities).toHaveBeenCalledWith(0, 20, undefined, 'ADMIN_UPDATE');
    });

    it('[LOG-AUTH-02] Bảo mật dữ liệu: Nhật ký đăng nhập ghi nhận đầy đủ địa chỉ IP và thông tin xác thực', async () => {
      vi.mocked(activityLogRepository.findLoginLogs).mockResolvedValue({
        total: 1,
        items: [mockLoginLogItem as any],
      });

      const res = await service.getLoginLogs(1, 20, '127.0.0.1');

      expect(res.items.length).toBe(1);
      expect(activityLogRepository.findLoginLogs).toHaveBeenCalledWith(0, 20, '127.0.0.1');
    });
  });

  describe('4. Data Conflict & Network Failures', () => {
    it('[LOG-05] Mất kết nối DB khi truy vấn logs ném lỗi hệ thống', async () => {
      vi.mocked(activityLogRepository.findActivities).mockRejectedValue(new Error('Connection lost (P1001)'));

      await expect(service.getActivities(1, 20)).rejects.toThrow('Connection lost');
    });
  });
});
