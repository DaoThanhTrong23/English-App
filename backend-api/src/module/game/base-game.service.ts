import { prisma } from "../../config/prisma.js";
import { shuffleArray } from "../../utils/array.js";

export interface GameProgressState {
  userId: number;
  currentScore?: number;
  matchedPairs?: number;
  currentMatchedPairs?: number;
  totalPairs?: number;
  turns?: number;
  lessonId?: number;
  connectedPairs?: { wordId: number; selectedMeaningId: number }[];
  updatedAt: Date;
}

export interface FinalizeGameInput {
  userId: number;
  gameCode: string;
  score: number;
  duration: number;
  correctPairs: number;
  totalPairs: number;
  turns?: number;
  lessonId?: number;
  maxScorePerPair?: number;
  maxTotalScore?: number;
}

export class BaseGameService {
  /**
   * Lấy danh sách từ vựng an toàn (type-safe, chống SQL injection, không dùng $queryRawUnsafe)
   */
    /**
   * Lấy cấu hình Game theo độ khó (EASY, NORMAL, HARD)
   */
  static async getGameConfig(gameCode: string, difficulty: string = 'NORMAL') {
    const defaultSettings: Record<string, { itemCount: number; pointsPerItem: number; penaltyPoints: number; timeLimit: number }> = {
      EASY: { itemCount: 6, pointsPerItem: 10, penaltyPoints: 2, timeLimit: 60 },
      NORMAL: { itemCount: 10, pointsPerItem: 15, penaltyPoints: 5, timeLimit: 45 },
      HARD: { itemCount: 15, pointsPerItem: 20, penaltyPoints: 10, timeLimit: 30 }
    };
    const fallback = defaultSettings[difficulty] || defaultSettings['NORMAL'];
    const setting = await prisma.gameSetting.findFirst({
      where: { game: { code: gameCode }, difficulty },
    });
    return setting || { difficulty, ...fallback };
  }

static async getWordsForGame(
    gameCode: string,
    userId: number,
    fallbackLimit: number = 6,
    lessonId?: number,
    difficulty: string = 'NORMAL'
  ) {
    let limit = fallbackLimit;

    const gameSetting = await BaseGameService.getGameConfig(gameCode, difficulty);
    if (gameSetting?.itemCount) {
      limit = gameSetting.itemCount;
    }

    // 1. Nếu có bài học cụ thể, ưu tiên lấy từ bài học
    if (lessonId) {
      const lessonWords = await prisma.lessonWord.findMany({
        where: { lessonId },
        take: limit,
        include: { word: true },
      });
      return shuffleArray(lessonWords.map((lw) => lw.word));
    }

    // 2. Lấy từ người dùng đang học
    const userWords = await prisma.userProgress.findMany({
      where: { userId },
      take: limit,
      include: { word: true },
      orderBy: { updatedAt: 'desc' },
    });

    let words = userWords.map((uw) => uw.word);

    // 3. Nếu thiếu từ, bù thêm ngẫu nhiên từ kho từ vựng (Không dùng $queryRawUnsafe hay ORDER BY RAND())
    if (words.length < limit) {
      const needed = limit - words.length;
      const excludedIds = words.map((w) => w.id);

      const totalWords = await prisma.word.count({
        where: {
          id: excludedIds.length > 0 ? { notIn: excludedIds } : undefined,
        },
      });

      if (totalWords > 0) {
        // Lấy random offset an toàn
        const maxOffset = Math.max(0, totalWords - needed);
        const randomSkip = Math.floor(Math.random() * (maxOffset + 1));

        const additionalWords = await prisma.word.findMany({
          where: {
            id: excludedIds.length > 0 ? { notIn: excludedIds } : undefined,
          },
          skip: randomSkip,
          take: needed,
        });

        words = [...words, ...additionalWords];
      }
    }

    return shuffleArray(words);
  }

  /**
   * Chốt điểm game tập trung: Chống bot, kiểm tra trần điểm, kiểm tra hạn mức XP ngày (Daily Cap)
   */
  static async finalizeGameResult(input: FinalizeGameInput) {
    const {
      userId,
      gameCode,
      duration,
      totalPairs,
      turns,
      maxScorePerPair = 20,
      maxTotalScore = 200,
    } = input;

    let score = input.score;

    // 1. Anti-Cheat: Chống bot bấm siêu tốc (< 3 giây)
    if (duration < 3) {
      score = 0;
    }

    // Chặn khai khống số cặp đúng
    const safeCorrectPairs = Math.max(0, Math.min(input.correctPairs, totalPairs));
    const maxLegitScore = safeCorrectPairs * maxScorePerPair;
    const safeScore = Math.max(0, Math.min(score, maxLegitScore, maxTotalScore));

    // 2. Daily Game XP Cap: 500 XP/ngày
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayXp = await prisma.gameHistory.aggregate({
      where: {
        userId,
        createdAt: { gte: startOfDay },
      },
      _sum: { score: true },
    });

    const currentTodayTotal = todayXp._sum.score || 0;
    const DAILY_GAME_XP_LIMIT = 500;
    const remainingCap = Math.max(0, DAILY_GAME_XP_LIMIT - currentTodayTotal);
    const actualXpToAward = Math.min(safeScore, remainingCap);

    // 3. Lưu lịch sử Game
    await prisma.gameHistory.create({
      data: {
        userId,
        gameCode,
        score: safeScore,
        durationSec: duration,
        correctPairs: safeCorrectPairs,
        totalPairs,
      },
    });

    // 4. Cộng điểm XP cho User
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        xpPoints: { increment: actualXpToAward },
      },
    });

    return {
      currentXp: updatedUser.xpPoints,
      score: safeScore,
      earnedXp: actualXpToAward,
      duration,
      turns,
      correctPairs: safeCorrectPairs,
      totalPairs,
    };
  }
}
