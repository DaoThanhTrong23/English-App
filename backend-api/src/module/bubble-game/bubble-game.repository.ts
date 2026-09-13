import { PrismaClient } from "../../generated/prisma/client.js";

const prisma = new PrismaClient();

// Cấu trúc lưu tiến trình tạm theo User trong RAM
export interface TemporaryProgress {
  userId: number;
  currentScore: number;
  matchedPairs: number;
  totalPairs: number;
  lessonId?: number;
  updatedAt: Date;
}

// Bảng tạm lưu tiến trình theo userId
const progressStore = new Map<number, TemporaryProgress>();

export class BubbleGameRepository {
  // 1. Lấy danh sách từ vựng theo bài học hoặc ngẫu nhiên
  async getWordsForGame(limit: number, lessonId?: number) {
    if (lessonId) {
      const lessonWords = await prisma.lessonWord.findMany({
        where: { lessonId },
        take: limit,
        include: { word: true }
      });
      return lessonWords.map((lw) => lw.word);
    }

    return prisma.word.findMany({
      take: limit,
      orderBy: { id: "asc" }
    });
  }

  // 2. Lưu tiến trình tạm thời của người chơi (theo userId)
  async saveTemporaryProgress(progress: TemporaryProgress): Promise<void> {
    progressStore.set(progress.userId, progress);
  }

  // 3. Lấy tiến trình tạm (nếu cần phục hồi khi vào lại game)
  async getTemporaryProgress(userId: number): Promise<TemporaryProgress | null> {
    return progressStore.get(userId) || null;
  }

  // 4. Xóa tiến trình tạm sau khi kết thúc
  async clearTemporaryProgress(userId: number): Promise<void> {
    progressStore.delete(userId);
  }

  // 5. Chốt điểm cuối cùng: Cộng điểm XP vào bảng user và xóa tạm
  async finalizeGameResult(data: {
    userId: number;
    score: number;
    duration: number;
    correctPairs: number;
    totalPairs: number;
    lessonId?: number;
  }) {
    // 1. Cộng điểm XP cho User trong MySQL
    const updatedUser = await prisma.user.update({
      where: { id: data.userId },
      data: {
        xpPoints: { increment: data.score }
      }
    });

    // 2. Giải phóng tiến trình tạm trong RAM
    progressStore.delete(data.userId);

    return {
      currentXp: updatedUser.xpPoints,
      score: data.score,
      duration: data.duration,
      correctPairs: data.correctPairs,
      totalPairs: data.totalPairs
    };
  }
}