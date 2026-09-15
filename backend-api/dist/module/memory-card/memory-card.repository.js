import { prisma } from "../../config/prisma.js";
// Bảng tạm lưu tiến trình theo userId trong bộ nhớ RAM
const memoryStore = new Map();
export class MemoryCardRepository {
    // 1. Lấy danh sách từ vựng theo bài học hoặc ngẫu nhiên từ database
    async getWordsForGame(limit = 6, lessonId) {
        if (lessonId) {
            const lessonWords = await prisma.lessonWord.findMany({
                where: { lessonId },
                take: limit,
                include: { word: true },
            });
            return lessonWords.map((lw) => lw.word);
        }
        return prisma.word.findMany({
            take: limit,
            orderBy: { id: "asc" },
        });
    }
    // 2. Lưu tiến trình tạm thời của người chơi (theo userId)
    async saveTemporaryProgress(progress) {
        memoryStore.set(progress.userId, progress);
    }
    // 3. Lấy tiến trình tạm (nếu cần phục hồi khi vào lại game)
    async getTemporaryProgress(userId) {
        return memoryStore.get(userId) || null;
    }
    // 4. Xóa tiến trình tạm sau khi kết thúc ván
    async clearTemporaryProgress(userId) {
        memoryStore.delete(userId);
    }
    // 5. Chốt điểm cuối cùng: Cộng điểm XP vào bảng user và xóa tạm
    async finalizeGameResult(data) {
        // 1. Cộng điểm XP cho User trong MySQL
        const updatedUser = await prisma.user.update({
            where: { id: data.userId },
            data: {
                xpPoints: { increment: data.score },
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
