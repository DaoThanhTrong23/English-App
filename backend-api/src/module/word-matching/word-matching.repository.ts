import { prisma } from "../../config/prisma.js";
import { BaseGameService, GameProgressState } from "../game/base-game.service.js";

export type WordMatchingProgress = GameProgressState;

// Bảng tạm lưu tiến trình theo userId trong bộ nhớ RAM
const progressStore = new Map<number, WordMatchingProgress>();

export class WordMatchingRepository {
  // 1. Lấy danh sách từ vựng theo bài học hoặc ngẫu nhiên từ database an toàn
  async getWordsForGame(userId: number, fallbackLimit: number = 6, lessonId?: number, difficulty: string = "NORMAL") {
    return BaseGameService.getWordsForGame('MATCHING', userId, fallbackLimit, lessonId, difficulty);
  }

  // 2. Lấy danh sách chi tiết các từ theo danh sách ID để đối chiếu chấm điểm
  async getWordsByIds(ids: number[]) {
    return prisma.word.findMany({
      where: {
        id: { in: ids },
      },
    });
  }

  // 3. Lưu tiến trình nối tạm thời của người chơi
  async saveTemporaryProgress(progress: WordMatchingProgress): Promise<void> {
    progressStore.set(progress.userId, progress);
  }

  // 4. Lấy tiến trình tạm
  async getTemporaryProgress(userId: number): Promise<WordMatchingProgress | null> {
    return progressStore.get(userId) || null;
  }

  // 5. Xóa tiến trình tạm sau khi kết thúc
  async clearTemporaryProgress(userId: number): Promise<void> {
    progressStore.delete(userId);
  }

  // 6. Chốt điểm cuối cùng với Anti-cheat & Daily XP Cap
  async finalizeGameResult(userId: number, earnedXp: number, totalQuestions: number, correctCount: number) {
    const result = await BaseGameService.finalizeGameResult({
      userId,
      gameCode: 'MATCHING',
      score: earnedXp,
      duration: 10, // Default duration if not measured
      correctPairs: correctCount,
      totalPairs: totalQuestions,
      maxScorePerPair: 20,
      maxTotalScore: 200,
    });

    // Giải phóng tiến trình tạm trong RAM
    progressStore.delete(userId);

    return {
      currentXp: result.currentXp,
    };
  }
}

export const wordMatchingRepository = new WordMatchingRepository();
