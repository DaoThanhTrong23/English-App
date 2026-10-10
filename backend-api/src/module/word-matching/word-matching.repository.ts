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
  async getWordsForGame(userId: number, fallbackLimit: number = 6, lessonId?: number) {
    let limit = fallbackLimit;
    const gameSetting = await prisma.gameSetting.findFirst({
      where: { game: { code: 'MATCHING' }, difficulty: 'NORMAL' }
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
  async finalizeGameResult(userId: number, earnedXp: number, totalQuestions: number, correctCount: number) {
      await prisma.gameHistory.create({
        data: {
          userId: userId,
          gameCode: 'MATCHING',
          score: earnedXp,
          durationSec: 0, // Word matching doesn't track duration yet
          correctPairs: correctCount,
          totalPairs: totalQuestions
        }
      });
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
