import { WordMatchingRepository, wordMatchingRepository } from "./word-matching.repository.js";
import {
  StartWordMatchingQuery,
  SubmitWordMatchingBody,
  SaveWordMatchingProgressBody,
} from "./word-matching.schema.js";
import { ApiError } from "../../shared/http/api-error.js";
import { logExecution } from "../../shared/decorators/log.decorator.js";
import { recordActivity } from "../../shared/decorators/activity.decorator.js";

// Kiểu dữ liệu item Cột A (Từ tiếng Anh)
export interface ColumnAItem {
  id: number;
  word: string;
  phonetic?: string | null;
  audioUrl?: string | null;
}

// Kiểu dữ liệu item Cột B (Nghĩa & Loại từ)
export interface ColumnBItem {
  id: number;
  meaning: string;
  partOfSpeech?: string | null;
  imageUrl?: string | null;
}

export class WordMatchingService {
  constructor(private repository: WordMatchingRepository = wordMatchingRepository) {}

  // Thuật toán xáo trộn mảng ngẫu nhiên (Fisher-Yates)
  private shuffle<T>(array: T[]): T[] {
    const list = [...array];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }

  // 1. Khởi tạo ván chơi: Lấy 10 từ vựng, chia thành Cột A (Tiếng Anh) và Cột B (Nghĩa + Loại từ), xáo trộn độc lập
  @logExecution()
  @recordActivity("USER_START_WORD_MATCHING", (_result, userId) => `Người dùng ID ${userId} bắt đầu ván chơi nối từ vựng mới`)
  async startGame(userId: number, query: StartWordMatchingQuery) {
    const limit = query.limit || 10;
    const words = await this.repository.getWordsForGame(limit, query.lessonId);

    if (!words || words.length < limit) {
      throw new ApiError(
        400,
        "not_enough_words",
        `Không đủ từ vựng để tạo bàn chơi nối từ (cần tối thiểu ${limit} từ).`
      );
    }

    // Cột A: Chứa từ vựng tiếng Anh, phiên âm, audio
    const columnA: ColumnAItem[] = words.map((w) => ({
      id: w.id,
      word: w.headword,
      phonetic: w.phonetic,
      audioUrl: w.audioUrl,
    }));

    // Cột B: Chứa nghĩa tiếng Việt và loại từ (noun, verb, adj...)
    const columnB: ColumnBItem[] = words.map((w) => ({
      id: w.id,
      meaning: w.meaning || "",
      partOfSpeech: w.partOfSpeech,
      imageUrl: w.imageUrl,
    }));

    // Xáo trộn độc lập cả 2 cột để đảo lộn thứ tự vị trí
    const shuffledColumnA = this.shuffle(columnA);
    const shuffledColumnB = this.shuffle(columnB);

    return {
      totalWords: words.length,
      columnA: shuffledColumnA,
      columnB: shuffledColumnB,
    };
  }

  // 2. Xác nhận kết quả nộp bài: Kiểm tra các cặp nối, chấm điểm, cộng XP và trả về đáp án chi tiết
  @logExecution()
  @recordActivity(
    "USER_SUBMIT_WORD_MATCHING",
    (result, userId) =>
      `Người dùng ID ${userId} hoàn thành game nối từ đạt ${result.score}/${result.maxScore} điểm (${result.correctCount}/${result.totalQuestions} từ đúng)`
  )
  async submitAnswers(userId: number, data: SubmitWordMatchingBody) {
    // Thu thập toàn bộ ID từ vựng có trong danh sách câu trả lời để truy vấn CSDL
    const wordIds = new Set<number>();
    data.answers.forEach((ans) => {
      wordIds.add(ans.wordId);
      wordIds.add(ans.selectedMeaningId);
    });

    const words = await this.repository.getWordsByIds(Array.from(wordIds));
    const wordMap = new Map(words.map((w) => [w.id, w]));

    // Đối chiếu từng cặp nối xem đúng hay sai
    let correctCount = 0;
    const details = data.answers.map((ans) => {
      const originalWord = wordMap.get(ans.wordId);
      const selectedMeaningWord = wordMap.get(ans.selectedMeaningId);

      // Cặp nối đúng khi ID từ ở Cột A khớp với ID nghĩa ở Cột B
      const isCorrect = ans.wordId === ans.selectedMeaningId;
      if (isCorrect) {
        correctCount += 1;
      }

      return {
        wordId: ans.wordId,
        word: originalWord?.headword || "",
        correctMeaning: originalWord?.meaning || "",
        partOfSpeech: originalWord?.partOfSpeech || null,
        userSelectedMeaningId: ans.selectedMeaningId,
        userSelectedMeaning: selectedMeaningWord?.meaning || "",
        isCorrect,
      };
    });

    const totalQuestions = data.answers.length;
    const wrongCount = totalQuestions - correctCount;

    // Mỗi câu đúng được 10 điểm (10 câu = tối đa 100 điểm)
    const pointsPerQuestion = 10;
    const score = correctCount * pointsPerQuestion;
    const maxScore = totalQuestions * pointsPerQuestion;

    // Cộng điểm XP vào tài khoản MySQL của user
    const finalizeRes = await this.repository.finalizeGameResult(userId, score);

    return {
      totalQuestions,
      correctCount,
      wrongCount,
      score,
      maxScore,
      earnedXp: score,
      currentXp: finalizeRes.currentXp,
      duration: data.duration,
      details,
    };
  }

  // 3. Lưu tiến trình nối tạm thời (nếu người chơi đang làm dở)
  @logExecution()
  @recordActivity("USER_SAVE_WORD_MATCHING_PROGRESS", (_result, userId) => `Người dùng ID ${userId} lưu tiến trình tạm của game nối từ`)
  async saveProgress(userId: number, data: SaveWordMatchingProgressBody) {
    await this.repository.saveTemporaryProgress({
      userId,
      lessonId: data.lessonId,
      currentMatchedPairs: data.currentMatchedPairs,
      totalPairs: data.totalPairs,
      connectedPairs: data.connectedPairs,
      updatedAt: new Date(),
    });

    return {
      message: "Lưu tiến trình tạm thời thành công",
      currentMatchedPairs: data.currentMatchedPairs,
      totalPairs: data.totalPairs,
    };
  }
}

export const wordMatchingService = new WordMatchingService();
