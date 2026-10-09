import { prisma } from '../../config/prisma.js';

export class LeaderboardService {
  async getLeaderboard(userId: number, limit: number = 20) {
    // Top users by XP
    const topUsers = await prisma.user.findMany({
      where: { role: 'user' },
      orderBy: { xpPoints: 'desc' },
      take: limit,
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
      select: { id: true, xpPoints: true }
    });

    let currentRank = 0;
    if (currentUser) {
      const higherXpCount = await prisma.user.count({
        where: {
          role: 'user',
          xpPoints: { gt: currentUser.xpPoints }
        }
      });
      currentRank = higherXpCount + 1;
    }

    return {
      topUsers,
      currentUser: {
        ...currentUser,
        rank: currentRank
      }
    };
  }
}

export const leaderboardService = new LeaderboardService();
