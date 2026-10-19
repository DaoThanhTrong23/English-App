import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardService } from '../../dashboard.service.js';
import { prisma } from '../../../../config/prisma.js';

vi.mock('../../../../config/prisma.js', () => ({
  prisma: {
    user: { count: vi.fn() },
    lesson: { count: vi.fn() },
    word: { count: vi.fn() },
    test: { count: vi.fn() },
    loginLog: { groupBy: vi.fn() },
  },
}));

describe('DashboardService - Unit Tests (QC 10-Year Standard)', () => {
  let service: DashboardService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DashboardService();
  });

  describe('1. Happy Cases', () => {
    it('[DSB-01] Tổng hợp số liệu thống kê Dashboard chính xác', async () => {
      vi.mocked(prisma.user.count).mockResolvedValue(100);
      vi.mocked(prisma.lesson.count).mockResolvedValue(15);
      vi.mocked(prisma.word.count).mockResolvedValue(500);
      vi.mocked(prisma.test.count).mockResolvedValue(25);
      vi.mocked(prisma.loginLog.groupBy).mockResolvedValue([{ userId: 1 }] as any);

      const stats = await service.getDashboardStats();

      expect(stats.totalStudents).toBe(100);
      expect(stats.totalCourses).toBe(15);
      expect(stats.totalWords).toBe(500);
      expect(stats.totalTests).toBe(25);
      expect(stats.levelData.length).toBe(3);
      expect(stats.trafficData.length).toBe(7);
    });
  });

  describe('2. Bad End & Boundary Cases', () => {
    it('[DSB-02] Hệ thống chưa có dữ liệu (0 bản ghi) xử lý an toàn', async () => {
      vi.mocked(prisma.user.count).mockResolvedValue(0);
      vi.mocked(prisma.lesson.count).mockResolvedValue(0);
      vi.mocked(prisma.word.count).mockResolvedValue(0);
      vi.mocked(prisma.test.count).mockResolvedValue(0);
      vi.mocked(prisma.loginLog.groupBy).mockResolvedValue([]);

      const stats = await service.getDashboardStats();

      expect(stats.totalStudents).toBe(0);
      expect(stats.totalWords).toBe(0);
      expect(stats.trafficData[0].active).toBe(0);
    });
  });

  describe('3. Concurrency Cases', () => {
    it('[DSB-03] Nhiều Admin cùng xem Dashboard đồng thời', async () => {
      vi.mocked(prisma.user.count).mockResolvedValue(10);
      vi.mocked(prisma.loginLog.groupBy).mockResolvedValue([]);

      const p1 = service.getDashboardStats();
      const p2 = service.getDashboardStats();

      const [s1, s2] = await Promise.all([p1, p2]);
      expect(s1.totalStudents).toBe(10);
      expect(s2.totalStudents).toBe(10);
    });
  });

  describe('4. Data Conflict & Network Failures', () => {
    it('[DSB-05] Mất kết nối DB khi truy vấn Dashboard ném lỗi 500', async () => {
      vi.mocked(prisma.user.count).mockRejectedValue(new Error('Prisma Client failed (P1001)'));

      await expect(service.getDashboardStats()).rejects.toThrow('Prisma Client failed');
    });
  });
});
