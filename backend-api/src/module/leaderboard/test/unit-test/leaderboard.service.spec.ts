import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LeaderboardService } from '../../leaderboard.service.js';
import { prisma } from '../../../../config/prisma.js';
import { mockLeaderboardTopUsers } from '../data-mock/leaderboard.mock.js';

vi.mock('../../../../config/prisma.js', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe('LeaderboardService - Unit Tests (QC 10-Year Standard)', () => {
  let service: LeaderboardService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new LeaderboardService();
  });

  describe('1. Happy Cases', () => {
    it('[LDB-01] Lấy bảng xếp hạng Top học viên và tính đúng thứ hạng cá nhân', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue(mockLeaderboardTopUsers as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 3, xpPoints: 500 } as any);
      vi.mocked(prisma.user.count).mockResolvedValue(2); // 2 người có XP > 500 -> rank 3

      const res = await service.getLeaderboard(3, 20);

      expect(res.topUsers.length).toBe(3);
      expect(res.currentUser.rank).toBe(3);
    });
  });

  describe('2. Bad End & Edge Cases', () => {
    it('[LDB-02] Người dùng không tồn tại trả về rank = 0 an toàn', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const res = await service.getLeaderboard(9999, 20);

      expect(res.topUsers).toHaveLength(0);
      expect(res.currentUser.rank).toBe(0);
    });

    it('[LDB-SEC-01] Bảo mật: Chỉ lấy học viên role user và không bị khóa (isLocked = false)', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 1, xpPoints: 100, isLocked: false } as any);
      vi.mocked(prisma.user.count).mockResolvedValue(0);

      await service.getLeaderboard(1, 20);

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { role: 'user', isLocked: false },
        })
      );
      expect(prisma.user.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { role: 'user', isLocked: false, xpPoints: { gt: 100 } },
        })
      );
    });

    it('[LDB-SEC-02] Bảo mật: Tài khoản bị khóa (isLocked = true) không được tính rank', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 5, xpPoints: 9999, isLocked: true } as any);

      const res = await service.getLeaderboard(5, 20);

      expect(res.currentUser.rank).toBe(0);
      expect(prisma.user.count).not.toHaveBeenCalled();
    });

    it('[LDB-SEC-03] Chống DoS: Giới hạn limit an toàn (min 1, max 100)', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 1, xpPoints: 50, isLocked: false } as any);

      // Thử limit cực lớn
      await service.getLeaderboard(1, 999999);
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 })
      );

      // Thử limit âm -> clamp về min 1
      await service.getLeaderboard(1, -50);
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 1 })
      );

      // Thử limit NaN -> fallback về 20
      await service.getLeaderboard(1, NaN);
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 20 })
      );
    });
  });

  describe('3. Concurrency Cases', () => {
    it('[LDB-03] Nhiều học viên cùng tải bảng xếp hạng song song', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 1, xpPoints: 100 } as any);
      vi.mocked(prisma.user.count).mockResolvedValue(0);

      const p1 = service.getLeaderboard(1, 10);
      const p2 = service.getLeaderboard(2, 10);

      await Promise.all([p1, p2]);
      expect(prisma.user.findMany).toHaveBeenCalledTimes(2);
    });
  });

  describe('4. Data Conflict & Network Failures', () => {
    it('[LDB-05] Mất kết nối DB khi lấy BXH ném lỗi hệ thống', async () => {
      vi.mocked(prisma.user.findMany).mockRejectedValue(new Error('Connection lost (P1001)'));

      await expect(service.getLeaderboard(1, 20)).rejects.toThrow('Connection lost');
    });
  });
});
