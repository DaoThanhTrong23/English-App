import { BaseGameService, GameProgressState } from "../game/base-game.service.js";

export type TemporaryProgress = GameProgressState;

// Bảng tạm lưu tiến trình theo userId
const progressStore = new Map<number, TemporaryProgress>();

export class MarioGameRepository {
  // 1. Lấy danh sách từ vựng an toàn
  async getWordsForGame(userId: number, fallbackLimit: number = 6, lessonId?: number) {
    return BaseGameService.getWordsForGame('MARIO', userId, fallbackLimit, lessonId);
  }

  // 2. Lưu tiến trình tạm thời của người chơi
  async saveTemporaryProgress(progress: TemporaryProgress): Promise<void> {
    progressStore.set(progress.userId, progress);
  }

  // 3. Lấy tiến trình tạm
  async getTemporaryProgress(userId: number): Promise<TemporaryProgress | null> {
    return progressStore.get(userId) || null;
  }

  // 4. Xóa tiến trình tạm
  async clearTemporaryProgress(userId: number): Promise<void> {
    progressStore.delete(userId);
  }

  // 5. Chốt điểm cuối cùng với Anti-cheat & Daily XP Cap
  async finalizeGameResult(data: {
    userId: number;
    score: number;
    duration: number;
    correctPairs: number;
    totalPairs: number;
    lessonId?: number;
  }) {
    const result = await BaseGameService.finalizeGameResult({
      ...data,
      gameCode: 'MARIO',
      maxScorePerPair: 20,
      maxTotalScore: 200,
    });

    // Giải phóng tiến trình tạm
    progressStore.delete(data.userId);

    return result;
  }
}
