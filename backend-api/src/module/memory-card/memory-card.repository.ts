import { prisma } from "../../config/prisma.js";

// Cấu trúc lưu tiến trình tạm theo User trong RAM
export interface MemoryGameProgress {
  userId: number;
  currentScore: number;
  matchedPairs: number;
  totalPairs: number;
  turns: number;
  lessonId?: number;
  updatedAt: Date;
}

// Bảng tạm lưu tiến trình theo userId trong bộ nhớ RAM
const memoryStore = new Map<number, MemoryGameProgress>();

export class MemoryCardRepository {
  // 1. Lấy danh sách từ vựng theo bài học hoặc ngẫu nhiên từ database
  async getWordsForGame(userId: number, fallbackLimit: number = 6, lessonId?: number) {
    let limit = fallbackLimit;
    const gameSetting = await prisma.gameSetting.findFirst({
      where: { game: { code: 'MEMORY' }, difficulty: 'NORMAL' }
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
  async saveTemporaryProgress(progress: MemoryGameProgress): Promise<void> {
    memoryStore.set(progress.userId, progress);
  }

  // 3. Lấy tiến trình tạm (nếu cần phục hồi khi vào lại game)
  async getTemporaryProgress(userId: number): Promise<MemoryGameProgress | null> {
    return memoryStore.get(userId) || null;
  }

  // 4. Xóa tiến trình tạm sau khi kết thúc ván
  async clearTemporaryProgress(userId: number): Promise<void> {
    memoryStore.delete(userId);
  }

  // 5. Chốt điểm cuối cùng: Cộng điểm XP vào bảng user và xóa tạm
  async finalizeGameResult(data: {
    userId: number;
    score: number;
    duration: number;
    turns: number;
    correctPairs: number;
    totalPairs: number;
    lessonId?: number;
  }) { // ANTI-CHEAT
    data.score = Math.max(0, Math.min(data.score, 300));

    // 1. Cộng điểm XP cho User trong MySQL
          // 1b. Luu GameHistory
      await prisma.gameHistory.create({
        data: {
          userId: data.userId,
          gameCode: 'MEMORY',
          score: data.score,
          durationSec: data.duration,
          correctPairs: data.correctPairs,
          totalPairs: data.totalPairs
        }
      });

      const updatedUser = await prisma.user.update({
      where: { id: data.userId },
      data: {
        xpPoints: { increment: Math.max(0, Math.min(data.score, 300)) },
      },
    });

    // 2. Giải phóng tiến trình tạm trong RAM
    memoryStore.delete(data.userId);

    return {
      currentXp: updatedUser.xpPoints,
      score: data.score,
      duration: data.duration,
      turns: data.turns,
      correctPairs: data.correctPairs,
      totalPairs: data.totalPairs,
    };
  }
}

export const memoryCardRepository = new MemoryCardRepository();
