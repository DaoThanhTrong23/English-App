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

export class MarioGameRepository {
  // 1. Lấy danh sách từ vựng theo bài học hoặc ngẫu nhiên
  async getWordsForGame(userId: number, fallbackLimit: number = 6, lessonId?: number) {
    let limit = fallbackLimit;
    const gameSetting = await prisma.gameSetting.findFirst({
      where: { game: { code: 'MARIO' }, difficulty: 'NORMAL' }
    });
    if (gameSetting) {
      limit = gameSetting.itemCount;
    }

    if (lessonId) {
      const lessonWords = await prisma.lessonWord.findMany({
        where: { lessonId },
        take: limit,
        include: { word: true },
      });
      return lessonWords.map((lw) => lw.word);
    }

    // Lấy từ vựng user đang học
    const userWords = await prisma.userProgress.findMany({
      where: { userId },
      take: limit,
      include: { word: true },
      orderBy: { updatedAt: 'desc' }
    });

    let words = userWords.map(uw => uw.word);

    // Bù thêm từ vựng ngẫu nhiên nếu thiếu (ORDER BY RAND())
    if (words.length < limit) {
      const needed = limit - words.length;
      let randomWords = [];
      
      if (words.length > 0) {
        const usedIds = words.map(w => w.id).join(',');
        randomWords = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM words WHERE id NOT IN (${usedIds}) ORDER BY RAND() LIMIT ${needed}`);
      } else {
        randomWords = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM words ORDER BY RAND() LIMIT ${needed}`);
      }
      
      words = [...words, ...randomWords.map(w => ({ ...w, imageUrl: w.image_url, audioUrl: w.audio_url, partOfSpeech: w.part_of_speech, headword: w.headword, meaning: w.meaning }))];
    }
    
    return words.sort(() => 0.5 - Math.random());
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
    data.score = Math.max(0, Math.min(data.score, 300));
    // 1. Cộng điểm XP cho User trong MySQL
    const updatedUser = await prisma.user.update({
      where: { id: data.userId },
      data: {
        xpPoints: { increment: Math.max(0, Math.min(data.score, 300)) }
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