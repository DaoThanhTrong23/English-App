const fs = require('fs');
const file = 'backend-api/src/module/student-vocabulary/student-vocabulary.service.ts';
let code = fs.readFileSync(file, 'utf8');

const srsLogic = `
  async getDueReviews(userId: number) {
    const now = new Date();
    const dueProgress = await this.repo.prisma.userProgress.findMany({
      where: { 
        userId,
        status: { in: ['learning', 'mastered'] },
        nextReviewDate: { lte: now }
      },
      include: { word: true }
    });
    return dueProgress;
  }

  async submitReview(userId: number, wordId: number, isCorrect: boolean) {
    const progress = await this.repo.prisma.userProgress.findUnique({
      where: { userId_wordId: { userId, wordId } }
    });

    if (!progress) throw new ApiError(404, "not_found", "Không tìm thấy tiến trình từ vựng này");

    let { memoryLevel, status } = progress;
    let nextReviewDate = new Date();

    if (isCorrect) {
      memoryLevel += 1;
      // SRS intervals: 1d, 3d, 7d, 14d, 30d, 90d
      const intervals = [1, 3, 7, 14, 30, 90];
      const addDays = intervals[Math.min(memoryLevel - 1, intervals.length - 1)];
      nextReviewDate.setDate(nextReviewDate.getDate() + addDays);
      if (memoryLevel >= 4) status = 'mastered';
    } else {
      memoryLevel = Math.max(1, memoryLevel - 1); // Trừ cấp
      nextReviewDate.setDate(nextReviewDate.getDate() + 1); // Mai học lại
      status = 'learning';
    }

    const updated = await this.repo.prisma.userProgress.update({
      where: { id: progress.id },
      data: { memoryLevel, nextReviewDate, status }
    });

    return updated;
  }
`;

if (!code.includes('getDueReviews')) {
  code = code.replace(/}\s*export const studentVocabularyService/g, srsLogic + '\n}\n\nexport const studentVocabularyService');
  fs.writeFileSync(file, code);
}
