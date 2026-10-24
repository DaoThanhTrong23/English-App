import { prisma } from '../../config/prisma.js';

export class LeaderboardService {
  async getLeaderboard(userId: number, limit: number = 20) {
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));

    // Top users by XP (chỉ hiển thị tài khoản học viên hợp lệ, loại trừ tài khoản bị khóa isLocked = true)
    const topUsers = await prisma.user.findMany({
      where: { role: { name: 'user' }, isLocked: false },
      orderBy: { xpPoints: 'desc' },
      take: safeLimit,
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        cefrLevel: true,
        xpPoints: true,
      }
    });

    // Current user rank
    // Count how many users have strictly more XP than current user
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, xpPoints: true, isLocked: true }
    });

    let currentRank = 0;
    if (currentUser && !currentUser.isLocked) {
      const higherXpCount = await prisma.user.count({
        where: {
          role: { name: 'user' },
          isLocked: false,
          xpPoints: { gt: currentUser.xpPoints }
        }
      });
      currentRank = higherXpCount + 1;
    }

    return {
      topUsers,
      currentUser: {
        id: currentUser?.id,
        xpPoints: currentUser?.xpPoints ?? 0,
        rank: currentRank
      }
    };
  }
}

export const leaderboardService = new LeaderboardService();
