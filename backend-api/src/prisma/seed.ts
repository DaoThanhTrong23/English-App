import { PrismaClient } from '../generated/prisma/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu quá trình seed dữ liệu (Master Data)...');

  const dataPath = path.join(__dirname, 'seed-data.json');
  if (!fs.existsSync(dataPath)) {
    console.error('❌ Không tìm thấy file seed-data.json!');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  try {
    // Tắt kiểm tra khóa ngoại để tránh lỗi khi insert có quan hệ phức tạp
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');

    // Xóa dữ liệu cũ (tùy chọn) để tránh duplicate data nếu cần
    // await prisma.$executeRawUnsafe('TRUNCATE TABLE Topic; TRUNCATE TABLE Lesson; ...');

    // 1. Topics
    if (data.topics?.length) {
      console.log(`Inserting ${data.topics.length} Topics...`);
      await prisma.topic.createMany({ data: data.topics, skipDuplicates: true });
    }

    // 2. Lessons
    if (data.lessons?.length) {
      console.log(`Inserting ${data.lessons.length} Lessons...`);
      await prisma.lesson.createMany({ data: data.lessons, skipDuplicates: true });
    }

    // 3. Words
    if (data.words?.length) {
      console.log(`Inserting ${data.words.length} Words...`);
      await prisma.word.createMany({ data: data.words, skipDuplicates: true });
    }

    // 4. LessonWords
    if (data.lessonWords?.length) {
      console.log(`Inserting ${data.lessonWords.length} LessonWords...`);
      await prisma.lessonWord.createMany({ data: data.lessonWords, skipDuplicates: true });
    }

    // 5. Tests
    if (data.tests?.length) {
      console.log(`Inserting ${data.tests.length} Tests...`);
      await prisma.test.createMany({ data: data.tests, skipDuplicates: true });
    }

    // 6. Questions
    if (data.questions?.length) {
      console.log(`Inserting ${data.questions.length} Questions...`);
      await prisma.question.createMany({ data: data.questions, skipDuplicates: true });
    }

    // 7. Answers
    if (data.answers?.length) {
      console.log(`Inserting ${data.answers.length} Answers...`);
      await prisma.answer.createMany({ data: data.answers, skipDuplicates: true });
    }

    // 8. Achievements
    if (data.achievements?.length) {
      console.log(`Inserting ${data.achievements.length} Achievements...`);
      await prisma.achievement.createMany({ data: data.achievements, skipDuplicates: true });
    }

    // 9. Games
    if (data.games?.length) {
      console.log(`Inserting ${data.games.length} Games...`);
      await prisma.game.createMany({ data: data.games, skipDuplicates: true });
    }

    // 10. GameSettings
    if (data.gameSettings?.length) {
      console.log(`Inserting ${data.gameSettings.length} GameSettings...`);
      await prisma.gameSetting.createMany({ data: data.gameSettings, skipDuplicates: true });
    }

    console.log('✅ Seed dữ liệu thành công!');
  } catch (error) {
    console.error('❌ Lỗi khi seed dữ liệu:', error);
  } finally {
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
    await prisma.$disconnect();
  }
}

main();
