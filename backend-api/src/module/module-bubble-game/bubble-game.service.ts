import crypto from "crypto";
import { BubbleGameRepository, InMemorySession } from "./bubble-game.repository.js";
import { StartGameQuery, MatchPairBody, FinishGameBody } from "./bubble-game.schema.js";

// Lớp Error nội bộ của module - Hoàn toàn không phụ thuộc vào shared
export class GameError extends Error {
    constructor(
        public readonly statusCode: number,
        public readonly code: string,
        message: string
    ) {
        super(message);
        this.name = "GameError";
    }
}

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

    // 1. Khởi tạo Game
    async startGame(userId: number, query: StartGameQuery) {
        const words = await this.repository.getWordsForGame(query.limit, query.lessonId);

        if (!words || words.length < 4) {
            throw new GameError(400, "not_enough_words", "Không đủ từ vựng để tạo bàn chơi (cần tối thiểu 4 từ).");
        }

        const sessionId = crypto.randomUUID();
        const wordIds = words.map((w) => w.id);

        // Lưu phiên chơi tạm vào RAM
        const sessionData: InMemorySession = {
            sessionId,
            userId,
            lessonId: query.lessonId ?? null,
            totalPairs: words.length,
            matchedPairIds: [],
            score: 0,
            wordIds,
            startTime: Date.now(),
            expiresAt: Date.now() + 60 * 60 * 1000 // 1 giờ
        };
        await this.repository.saveSession(sessionData);

        // Xáo trộn 2 danh sách bong bóng riêng biệt cho giao diện
        const wordBubbles = this.shuffle(
            words.map((w) => ({
                id: w.id,
                word: w.headword,
                partOfSpeech: w.partOfSpeech,
                phonetic: w.phonetic
            }))
        );

        const meaningBubbles = this.shuffle(
            words.map((w) => ({
                id: w.id,
                meaning: w.meaning,
                imageUrl: w.imageUrl,
                audioUrl: w.audioUrl
            }))
        );

        return {
            sessionId,
            totalPairs: words.length,
            wordBubbles,
            meaningBubbles
        };
    }

    // 2. Kiểm tra ghép đúng / sai & Lưu tiến trình tạm
    async matchPair(userId: number, data: MatchPairBody) {
        const session = await this.repository.getSession(data.sessionId);

        if (!session) {
            throw new GameError(404, "session_not_found", "Phiên chơi không tồn tại hoặc đã hết hạn.");
        }

        if (session.userId !== userId) {
            throw new GameError(403, "forbidden", "Bạn không có quyền thao tác trên phiên chơi này.");
        }

        if (!session.wordIds.includes(data.wordId)) {
            throw new GameError(400, "invalid_word", "Từ vựng không thuộc ván chơi này.");
        }

        if (session.matchedPairIds.includes(data.wordId)) {
            throw new GameError(400, "already_matched", "Bong bóng này đã được ghép hoàn thành trước đó.");
        }

        // Kiểm tra ghép đúng: wordId khớp meaningId
        const isMatch = data.wordId === data.meaningId;

        if (!isMatch) {
            // Ghép sai: Giữ nguyên, không lưu tiến trình
            return {
                isMatch: false,
                score: session.score,
                matchedCount: session.matchedPairIds.length,
                totalPairs: session.totalPairs,
                isCompleted: false
            };
        }

        // Ghép đúng: Cộng điểm (+10đ), cập nhật tiến trình tạm ngay lập tức
        session.matchedPairIds.push(data.wordId);
        session.score += 10;
        await this.repository.saveSession(session);

        const isCompleted = session.matchedPairIds.length === session.totalPairs;

        return {
            isMatch: true,
            score: session.score,
            matchedCount: session.matchedPairIds.length,
            totalPairs: session.totalPairs,
            isCompleted
        };
    }

    // 3. Kết thúc Game, chốt điểm và XÓA tiến trình tạm
    async finishGame(userId: number, data: FinishGameBody) {
        const session = await this.repository.getSession(data.sessionId);

        if (!session) {
            throw new GameError(404, "session_not_found", "Phiên chơi không tồn tại hoặc đã kết thúc.");
        }

        if (session.userId !== userId) {
            throw new GameError(403, "forbidden", "Bạn không có quyền thao tác trên phiên chơi này.");
        }

        const duration = Math.max(1, Math.floor((Date.now() - session.startTime) / 1000));

        // 1. Ghi nhận kết quả vào database MySQL (Bảng user & activity_log có sẵn)
        const result = await this.repository.finalizeGameResult({
            userId: session.userId,
            score: session.score,
            duration,
            correctPairs: session.matchedPairIds.length,
            totalPairs: session.totalPairs
        });

        // 2. BẮT BUỘC: Xóa sạch phiên tạm trong bộ nhớ
        await this.repository.deleteSession(data.sessionId);

        return {
            message: "Hoàn tất ván chơi thành công!",
            result: {
                totalScore: session.score,
                durationSeconds: duration,
                correctPairs: session.matchedPairIds.length,
                totalPairs: session.totalPairs,
                currentXp: result.currentXp,
                completedAt: result.completedAt
            }
        };
    }
}