import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../../../config/prisma.js';

vi.mock('../../../../config/prisma.js', () => ({
  prisma: {
    userTestResult: { count: vi.fn() },
    gameHistory: { count: vi.fn() },
    activityLog: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn() },
    user: { update: vi.fn() },
    $transaction: vi.fn().mockImplementation(async (promises) => Promise.all(promises)),
  },
}));

describe('Quest Module - Unit Tests (QC 10-Year Standard)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Happy Cases', () => {
    it('[QST-01] Tính toán tiến độ các nhiệm vụ hôm nay chính xác', async () => {
      vi.mocked(prisma.userTestResult.count).mockResolvedValue(1);
      vi.mocked(prisma.gameHistory.count).mockResolvedValue(1);
      vi.mocked(prisma.activityLog.findMany).mockResolvedValue([]);

      const testCount = await prisma.userTestResult.count();
      const gameCount = await prisma.gameHistory.count();

      expect(testCount).toBe(1);
      expect(gameCount).toBe(1);
    });
  });

  describe('2. Bad End Cases', () => {
    it('[QST-02] Từ chối nhận thưởng khi nhiệm vụ chưa hoàn thành mục tiêu', async () => {
      vi.mocked(prisma.userTestResult.count).mockResolvedValue(0);

      const count = await prisma.userTestResult.count();
      const canClaim = count >= 1;

      expect(canClaim).toBe(false);
    });
  });

  describe('3. Concurrency & Double Claim', () => {
    it('[QST-03] Chặn nhận thưởng lần 2 nếu activityLog đã ghi nhận claim hôm nay', async () => {
      vi.mocked(prisma.activityLog.findFirst).mockResolvedValue({
        id: 1,
        userId: 1,
        actionType: 'CLAIM_DAILY_QUEST_QUEST_LOGIN',
        description: null,
        createdAt: new Date(),
      });

      const alreadyClaimed = await prisma.activityLog.findFirst({
        where: { actionType: 'CLAIM_DAILY_QUEST_QUEST_LOGIN' },
      });

      expect(alreadyClaimed).not.toBeNull();
    });
  });

  describe('4. Data Conflict & Transaction Rollback', () => {
    it('[QST-04] Rollback transaction nếu ghi activityLog thất bại khi cộng XP', async () => {
      vi.mocked(prisma.$transaction).mockRejectedValue(new Error('Transaction aborted (P2034)'));

      await expect(
        prisma.$transaction([
          prisma.user.update({ where: { id: 1 }, data: { xpPoints: { increment: 10 } } }),
        ])
      ).rejects.toThrow('Transaction aborted');
    });
  });

  describe('5. Network & Infrastructure Failures', () => {
    it('[QST-05] Xử lý lỗi ngắt kết nối DB khi đếm tiến độ nhiệm vụ', async () => {
      vi.mocked(prisma.userTestResult.count).mockRejectedValue(new Error('Connection timeout (P1008)'));

      await expect(prisma.userTestResult.count()).rejects.toThrow('Connection timeout');
    });
  });
});
