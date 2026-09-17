import { prisma } from "../../config/prisma.js";
import { logExecution } from "../../shared/decorators/log.decorator.js";

export class AchievementRepository {
  @logExecution()
  async findAll() {
    return prisma.achievement.findMany({
      orderBy: { requireXp: 'asc' }
    });
  }

  @logExecution()
  async findById(id: number) {
    return prisma.achievement.findUnique({
      where: { id },
    });
  }

  @logExecution()
  async create(data: {
    title: string;
    description?: string | null;
    iconUrl?: string | null;
    requireXp: number;
    requireStreak: number;
  }) {
    return prisma.achievement.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        iconUrl: data.iconUrl ?? null,
        requireXp: data.requireXp,
        requireStreak: data.requireStreak,
      },
    });
  }

  @logExecution()
  async update(id: number, data: any) {
    return prisma.achievement.update({
      where: { id },
      data,
    });
  }

  @logExecution()
  async delete(id: number) {
    return prisma.achievement.delete({
      where: { id },
    });
  }
}

export const achievementRepository = new AchievementRepository();
