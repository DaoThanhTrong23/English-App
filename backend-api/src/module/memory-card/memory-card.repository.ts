import { BaseGameService, GameProgressState } from "../game/base-game.service.js";

export type MemoryGameProgress = GameProgressState;

// Bảng tạm lưu tiến trình theo userId trong bộ nhớ RAM
const memoryStore = new Map<number, MemoryGameProgress>();

export class MemoryCardRepository {
  // 1. Lấy danh sách từ vựng an toàn
  async getWordsForGame(userId: number, fallbackLimit: number = 6, lessonId?: number) {
    return BaseGameService.getWordsForGame('MEMORY', userId, fallbackLimit, lessonId);
  }

  // 2. Lưu tiến trình tạm thời của người chơi
  async saveTemporaryProgress(progress: MemoryGameProgress): Promise<void> {
    memoryStore.set(progress.userId, progress);
  }

  // 3. Lấy tiến trình tạm
  async getTemporaryProgress(userId: number): Promise<MemoryGameProgress | null> {
    return memoryStore.get(userId) || null;
  }

  // 4. Xóa tiến trình tạm sau khi kết thúc ván
  async clearTemporaryProgress(userId: number): Promise<void> {
    memoryStore.delete(userId);
  }

  // 5. Chốt điểm cuối cùng với Anti-cheat & Daily XP Cap
  async finalizeGameResult(data: {
    userId: number;
    score: number;
    duration: number;
    turns: number;
    correctPairs: number;
    totalPairs: number;
    lessonId?: number;
  }) {
    const result = await BaseGameService.finalizeGameResult({
      ...data,
      gameCode: 'MEMORY',
      maxScorePerPair: 20,
      maxTotalScore: 200,
    });

    // Giải phóng tiến trình tạm
    memoryStore.delete(data.userId);

    return result;
  }
}

export const memoryCardRepository = new MemoryCardRepository();
