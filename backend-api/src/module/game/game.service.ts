import { gameRepository, GameRepository } from "./game.repository.js";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../shared/http/api-error.js";
import { UpdateGameSettingsInput } from "./game.schema.js";
import { Prisma } from "../../generated/prisma/index.js";

export class GameService {
  constructor(private gameRepo: GameRepository) {}

  async getAllGames() {
    return await this.gameRepo.findAll();
  }

  async updateSettings(id: number, data: UpdateGameSettingsInput) {
    const game = await prisma.game.findUnique({ where: { id } });
    if (!game) throw new ApiError(404, "not_found", "Game không tồn tại");

    return await this.gameRepo.updateSettings(id, data.settings);
  }

  async play(code: string, difficulty: string, userCefrLevel: string) {
    const game = await this.gameRepo.findByCode(code);
    if (!game) throw new ApiError(404, "not_found", "Game không tồn tại");

    const setting = game.settings.find((s) => s.difficulty === difficulty);
    if (!setting) {
      throw new ApiError(404, "not_found", "Cấu hình độ khó này chưa được thiết lập");
    }

    // Lấy random từ vựng dựa trên userCefrLevel
    // Cần lấy đủ số lượng = setting.itemCount
    const words = await prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT id, headword, meaning, partOfSpeech, phonetic, audioUrl, imageUrl
      FROM Word
      WHERE cefrLevel = ${userCefrLevel}
      ORDER BY RAND()
      LIMIT ${setting.itemCount}
    `);

    return {
      game: {
        id: game.id,
        name: game.name,
        code: game.code,
      },
      setting: {
        difficulty: setting.difficulty,
        itemCount: setting.itemCount,
        pointsPerItem: setting.pointsPerItem,
        timeLimit: setting.timeLimit,
      },
      words,
    };
  }
}

export const gameService = new GameService(gameRepository);
