import { prisma } from "../src/config/prisma.js";
import { LearningStatus } from "../src/generated/prisma/index.js";

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, email: true, username: true } });
  const words = await prisma.word.findMany({ take: 25, select: { id: true, headword: true } });

  if (words.length === 0) {
    console.log("No words found in database.");
    return;
  }

  const now = new Date();

  for (const user of users) {
    // Add 8-12 words for each user
    const sampleWords = words.slice(0, 10);
    for (let i = 0; i < sampleWords.length; i++) {
      const w = sampleWords[i];
      let status = LearningStatus.learning;
      let memoryLevel = i % 4; // 0, 1, 2, 3
      let nextReviewDate = new Date();

      if (i < 4) {
        // Due today or overdue
        nextReviewDate.setDate(now.getDate() - 1);
        status = LearningStatus.learning;
      } else if (i < 7) {
        // Due today
        nextReviewDate = new Date(now.getTime() - 1000 * 60);
        status = LearningStatus.learning;
      } else if (i >= 8) {
        // Mastered, due in 14 days
        nextReviewDate.setDate(now.getDate() + 14);
        status = LearningStatus.mastered;
        memoryLevel = 4;
      } else {
        // Due tomorrow
        nextReviewDate.setDate(now.getDate() + 2);
        status = LearningStatus.learning;
      }

      await prisma.userProgress.upsert({
        where: { userId_wordId: { userId: user.id, wordId: w.id } },
        create: {
          userId: user.id,
          wordId: w.id,
          status,
          memoryLevel,
          nextReviewDate
        },
        update: {
          status,
          memoryLevel,
          nextReviewDate
        }
      });
    }
  }

  const count = await prisma.userProgress.count();
  console.log(`Seeded UserProgress successfully. Total records now: ${count}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
