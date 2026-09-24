import { prisma } from "../../config/prisma.js";

// Cấu trúc lưu tiến trình tạm theo User trong RAM
export interface WordMatchingProgress {
  userId: number;
  lessonId?: number;
  currentMatchedPairs: number;
  totalPairs: number;
  connectedPairs: { wordId: number; selectedMeaningId: number }[];
  updatedAt: Date;
}

// Bảng tạm lưu tiến trình theo userId trong bộ nhớ RAM
const progressStore = new Map<number, WordMatchingProgress>();

export class WordMatchingRepository {
  // 1. Lấy danh sách từ vựng theo bài học hoặc ngẫu nhiên từ database
  async getWordsForGame(limit: number = 10, lessonId?: number) {
    if (lessonId) {
      const lessonWords = await prisma.lessonWord.findMany({
        where: { lessonId },
        take: limit,
        include: { word: true },
      });
      return lessonWords.map((lw) => lw.word);
    }

    return prisma.word.findMany({
      take: limit,
      orderBy: { id: "asc" },
    });
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

  // 4. Lấy tiến trình tạm (nếu cần phục hồi khi vào lại game)
  async getTemporaryProgress(userId: number): Promise<WordMatchingProgress | null> {
    return progressStore.get(userId) || null;
  }

  // 5. Xóa tiến trình tạm sau khi kết thúc
  async clearTemporaryProgress(userId: number): Promise<void> {
    progressStore.delete(userId);
  }

  // 6. Chốt điểm cuối cùng: Cộng điểm XP vào bảng user và xóa tạm
  async finalizeGameResult(userId: number, earnedXp: number) {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        xpPoints: { increment: earnedXp },
      },
    });

    // Giải phóng tiến trình tạm trong RAM
    progressStore.delete(userId);

    return {
      currentXp: updatedUser.xpPoints,
    };
  }
}

export const wordMatchingRepository = new WordMatchingRepository();
