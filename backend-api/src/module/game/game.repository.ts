import { prisma } from "../../config/prisma.js";

export class GameRepository {
  async findAll() {
    return await prisma.game.findMany({
      include: {
        settings: true,
      },
    });
  }

  async findByCode(code: string) {
    return await prisma.game.findUnique({
      where: { code },
      include: {
        settings: true,
      },
    });
  }

  async updateSettings(gameId: number, settings: any[]) {
    // Upsert all settings for the game
    const results = [];
    for (const s of settings) {
      const setting = await prisma.gameSetting.upsert({
        where: {
          gameId_difficulty: {
            gameId,
            difficulty: s.difficulty,
          },
        },
        update: {
          itemCount: s.itemCount,
          pointsPerItem: s.pointsPerItem,
          timeLimit: s.timeLimit,
        },
        create: {
          gameId,
          difficulty: s.difficulty,
          itemCount: s.itemCount,
          pointsPerItem: s.pointsPerItem,
          timeLimit: s.timeLimit,
        },
      });
      results.push(setting);
    }
    return results;
  }
}

export const gameRepository = new GameRepository();
