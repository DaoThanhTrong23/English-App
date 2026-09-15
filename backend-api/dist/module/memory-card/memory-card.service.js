var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { memoryCardRepository } from "./memory-card.repository.js";
import { ApiError } from "../../shared/http/api-error.js";
import { logExecution } from "../../shared/decorators/log.decorator.js";
import { recordActivity } from "../../shared/decorators/activity.decorator.js";
export class MemoryCardService {
    repository;
    constructor(repository = memoryCardRepository) {
        this.repository = repository;
    }
    // Thuật toán xáo trộn Fisher-Yates
    shuffle(array) {
        const list = [...array];
        for (let i = list.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [list[i], list[j]] = [list[j], list[i]];
        }
        return list;
    }
    // 1. Khởi tạo Game: Lấy 6 từ vựng, tạo thành 12 thẻ (6 từ + 6 nghĩa) và xáo trộn ngẫu nhiên
    async startGame(userId, query) {
        const limit = query.limit || 6;
        const words = await this.repository.getWordsForGame(limit, query.lessonId);
        if (!words || words.length < limit) {
            throw new ApiError(400, "not_enough_words", `Không đủ từ vựng để tạo bàn chơi (cần tối thiểu ${limit} từ).`);
        }
        // Tạo 12 thẻ từ 6 từ vựng: mỗi từ tạo 1 thẻ Word và 1 thẻ Meaning
        const cards = [];
        words.forEach((w) => {
            // Thẻ Word (Tiếng Anh)
            cards.push({
                id: `card_word_${w.id}`,
                pairId: w.id,
                type: "word",
                content: w.headword,
                phonetic: w.phonetic,
                partOfSpeech: w.partOfSpeech,
            });
            // Thẻ Meaning (Tiếng Việt)
            cards.push({
                id: `card_meaning_${w.id}`,
                pairId: w.id,
                type: "meaning",
                content: w.meaning || "",
                imageUrl: w.imageUrl,
                audioUrl: w.audioUrl,
            });
        });
        // Xáo trộn ngẫu nhiên cả 12 thẻ để hiển thị trên lưới 3x4 hoặc 4x3 ở giao diện
        const shuffledCards = this.shuffle(cards);
        return {
            totalPairs: words.length,
            totalCards: shuffledCards.length, // 12 thẻ
            cards: shuffledCards,
        };
    }
    // 2. Lưu tiến trình tạm thời (lưu điểm, số cặp đã mở, số lượt lật)
    async saveProgress(userId, data) {
        await this.repository.saveTemporaryProgress({
            userId,
            currentScore: data.currentScore,
            matchedPairs: data.matchedPairs,
            totalPairs: data.totalPairs,
            turns: data.turns,
            lessonId: data.lessonId,
            updatedAt: new Date(),
        });
        return {
            message: "Lưu tiến trình tạm thời thành công",
            currentScore: data.currentScore,
            matchedPairs: data.matchedPairs,
            totalPairs: data.totalPairs,
            turns: data.turns,
        };
    }
    // 3. Kết thúc Game: Chốt kết quả, cộng điểm XP vào User và giải phóng bộ nhớ tạm
    async finishGame(userId, data) {
        const result = await this.repository.finalizeGameResult({
            userId,
            score: data.totalScore,
            duration: data.duration,
            turns: data.turns,
            correctPairs: data.correctPairs,
            totalPairs: data.totalPairs,
            lessonId: data.lessonId,
        });
        return {
            message: "Hoàn tất ván Memory Card thành công!",
            result: {
                totalScore: result.score,
                durationSeconds: result.duration,
                turns: result.turns,
                correctPairs: result.correctPairs,
                totalPairs: result.totalPairs,
                currentXp: result.currentXp,
            },
        };
    }
}
__decorate([
    logExecution(),
    recordActivity("USER_START_MEMORY_GAME", (_result, userId) => `Người dùng ${userId} bắt đầu ván Memory Card mới`),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], MemoryCardService.prototype, "startGame", null);
__decorate([
    logExecution(),
    recordActivity("USER_SAVE_MEMORY_GAME_PROGRESS", (_result, userId) => `Người dùng ID ${userId} cập nhật tiến trình Memory Card`),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], MemoryCardService.prototype, "saveProgress", null);
__decorate([
    logExecution(),
    recordActivity("USER_FINISH_MEMORY_GAME", (result, userId) => `Người dùng ID ${userId} hoàn thành Memory Card với ${result.result.totalScore} điểm sau ${result.result.turns} lượt lật`),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], MemoryCardService.prototype, "finishGame", null);
export const memoryCardService = new MemoryCardService();
