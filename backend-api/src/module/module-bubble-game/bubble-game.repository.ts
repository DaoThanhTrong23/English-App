import { PrismaClient } from "../../generated/prisma/client.js";

const prisma = new PrismaClient();

// Cấu trúc dữ liệu lưu tiến trình tạm trong RAM
export interface InMemorySession {
    sessionId: string;
    userId: number;
    lessonId: number | null;
    totalPairs: number;
    matchedPairIds: number[];
    score: number;
    wordIds: number[];
    startTime: number;
    expiresAt: number;
}

// BỘ NHỚ TẠM (In-Memory Map) - Thay thế cho Redis mà không cần cài thêm package
const sessionStore = new Map<string, InMemorySession>();
const SESSION_TTL_MS = 60 * 60 * 1000; // 1 giờ

export class BubbleGameRepository {
    // 1. Lấy từ vựng từ bảng `word` có sẵn
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

    // 2. Thao tác Bộ nhớ tạm (In-Memory)
    async saveSession(session: InMemorySession): Promise<void> {
        sessionStore.set(session.sessionId, session);
    }

    async getSession(sessionId: string): Promise<InMemorySession | null> {
        const session = sessionStore.get(sessionId);
        if (!session) return null;

        // Kiểm tra hết hạn TTL
        if (Date.now() > session.expiresAt) {
            sessionStore.delete(sessionId);
            return null;
        }
        return session;
    }

    async deleteSession(sessionId: string): Promise<void> {
        sessionStore.delete(sessionId);
    }

    // 3. Chốt kết quả vào 2 bảng CÓ SẴN: `user` (cộng XP) và `activity_log`
    async finalizeGameResult(data: {
        userId: number;
        score: number;
        duration: number;
        correctPairs: number;
        totalPairs: number;
    }) {
        return prisma.$transaction(async (tx) => {
            // a. Cộng điểm vào bảng user có sẵn
            const updatedUser = await tx.user.update({
                where: { id: data.userId },
                data: {
                    xpPoints: { increment: data.score }
                }
            });

            // b. Ghi nhận log vào bảng activity_log có sẵn
            const log = await tx.activityLog.create({
                data: {
                    userId: data.userId,
                    actionType: "BUBBLE_GAME_FINISH",
                    description: JSON.stringify({
                        totalScore: data.score,
                        durationSeconds: data.duration,
                        correctPairs: data.correctPairs,
                        totalPairs: data.totalPairs
                    })
                }
            });

            return {
                logId: log.id,
                currentXp: updatedUser.xpPoints,
                completedAt: log.createdAt
            };
        });
    }
}