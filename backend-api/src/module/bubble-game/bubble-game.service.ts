import { BubbleGameRepository } from "./bubble-game.repository.js";
import { StartGameQuery, MatchPairBody, FinishGameBody } from "./bubble-game.schema.js";
import { ApiError } from "../../shared/http/api-error.js";
import { logExecution } from "../../shared/decorators/log.decorator.js";
import { recordActivity } from "../../shared/decorators/activity.decorator.js";

export class BubbleGameService {
  private repository: BubbleGameRepository;

  constructor() {
    this.repository = new BubbleGameRepository();
  }

  // Thuật toán trộn ngẫu nhiên bong bóng (Fisher-Yates)
  private shuffle<T>(array: T[]): T[] {
    const list = [...array];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }

  // 1. Khởi tạo Game: Chỉ lấy từ vựng và xáo trộn bong bóng gửi FE
  @logExecution()
  @recordActivity("USER_START_GAME", (_result, userId) => `Người dùng ${userId} bắt đầu bubble game mới, nhận danh sách từ vựng`)
  async startGame(userId: number, query: StartGameQuery) {
    const words = await this.repository.getWordsForGame(query.limit, query.lessonId);

    if (!words || words.length < 4) {
      throw new ApiError(400, "not_enough_words", "Không đủ từ vựng để tạo bàn chơi (cần tối thiểu 4 từ).");
    }

    // Xáo trộn danh sách bong bóng từ vựng
    const wordBubbles = this.shuffle(
      words.map((w) => ({
        id: w.id,
        word: w.headword,
        partOfSpeech: w.partOfSpeech,
        phonetic: w.phonetic
      }))
    );

    // Xáo trộn danh sách bong bóng ý nghĩa
    const meaningBubbles = this.shuffle(
      words.map((w) => ({
        id: w.id,
        meaning: w.meaning,
        imageUrl: w.imageUrl,
        audioUrl: w.audioUrl
      }))
    );

    return {
      totalPairs: words.length,
      wordBubbles,
      meaningBubbles
    };
  }

  // 2. Lưu tiến trình tạm thời (FE đã tự kiểm tra đúng/sai)
  @logExecution()
  @recordActivity("USER_SAVE_PROCESS_GAME", (_result, userId) => `Người dùng ID ${userId} lưu tiến trình tạm của game`)
  async matchPair(userId: number, data: MatchPairBody) {
    await this.repository.saveTemporaryProgress({
      userId,
      currentScore: data.currentScore,
      matchedPairs: data.matchedPairs,
      totalPairs: data.totalPairs,
      lessonId: data.lessonId,
      updatedAt: new Date()
    });

    return {
      message: "Lưu tiến trình tạm thời thành công",
      currentScore: data.currentScore,
      matchedPairs: data.matchedPairs,
      totalPairs: data.totalPairs
    };
  }

  // 3. Kết thúc Game: Nhận thông tin kết quả từ FE và lưu chốt điểm
  @logExecution()
  @recordActivity("USER_FINISH_GAME", (result, userId) => `Người dùng ID ${userId} hoàn thành game với ${result.result.totalScore} điểm`)
  async finishGame(userId: number, data: FinishGameBody) {
    const result = await this.repository.finalizeGameResult({
      userId,
      score: data.totalScore,
      duration: data.duration,
      correctPairs: data.correctPairs,
      totalPairs: data.totalPairs,
      lessonId: data.lessonId
    });

    return {
      message: "Hoàn tất ván chơi thành công!",
      result: {
        totalScore: result.score,
        durationSeconds: result.duration,
        correctPairs: result.correctPairs,
        totalPairs: result.totalPairs,
        currentXp: result.currentXp
      }
    };
  }
}