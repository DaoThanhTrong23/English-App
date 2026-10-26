import { prisma } from './src/config/prisma.js';

async function reseedTests() {
  console.log("Đang xóa tất cả bài Test cũ...");
  await prisma.test.deleteMany({});
  
  console.log("Đang tải danh sách Lesson...");
  const lessons = await prisma.lesson.findMany({
    include: { topic: true }
  });
  
  console.log(`Đã tìm thấy ${lessons.length} bài học. Bắt đầu tạo 4 bài Luyện tập (Nghe, Nói, Đọc, Viết) cho mỗi bài...`);
  
  for (const lesson of lessons) {
    const level = lesson.cefrLevel || 'A1';
    
    // 1. Bài Luyện Đọc (Reading)
    const readTest = await prisma.test.create({
      data: {
        lessonId: lesson.id,
        title: `Bài Luyện Đọc`,
        description: `Bài tập rèn luyện kỹ năng đọc hiểu - ${lesson.title}`,
        ceftLevel: level
      }
    });
    
    const readQ = await prisma.question.create({
      data: {
        testId: readTest.id,
        quesionText: `Đọc đoạn văn sau và chọn ý chính: "This lesson helps you improve your skills in ${lesson.title}. It is very important."`,
        questionType: 'multiple_choice',
        points: 10,
        skillCategory: 'Reading',
        difficultyElo: 1200
      }
    });
    await prisma.answer.createMany({
      data: [
        { questionId: readQ.id, answerText: `Ý chính là giới thiệu về bài học`, isCorrect: true },
        { questionId: readQ.id, answerText: `Ý chính là về thời tiết`, isCorrect: false },
        { questionId: readQ.id, answerText: `Ý chính là về thể thao`, isCorrect: false },
        { questionId: readQ.id, answerText: `Ý chính là về nấu ăn`, isCorrect: false }
      ]
    });

    // 2. Bài Luyện Nghe (Listening)
    const listenTest = await prisma.test.create({
      data: {
        lessonId: lesson.id,
        title: `Bài Luyện Nghe`,
        description: `Bài tập rèn luyện kỹ năng nghe hiểu - ${lesson.title}`,
        ceftLevel: level
      }
    });
    await prisma.question.create({
      data: {
        testId: listenTest.id,
        quesionText: `Hãy nghe đoạn băng và gõ lại câu bạn nghe được.`,
        questionType: 'listening',
        points: 10,
        skillCategory: 'Listening',
        audioUrl: 'https://example.com/sample-audio.mp3',
        difficultyElo: 1200
      }
    });

    // 3. Bài Luyện Nói (Speaking)
    const speakTest = await prisma.test.create({
      data: {
        lessonId: lesson.id,
        title: `Bài Luyện Nói`,
        description: `Bài tập rèn luyện phát âm và giao tiếp - ${lesson.title}`,
        ceftLevel: level
      }
    });
    await prisma.question.create({
      data: {
        testId: speakTest.id,
        quesionText: `Phát âm rõ ràng câu sau: "I am learning English every day to get better."`,
        questionType: 'speaking',
        points: 10,
        skillCategory: 'Speaking',
        difficultyElo: 1200
      }
    });

    // 4. Bài Luyện Viết (Writing)
    const writeTest = await prisma.test.create({
      data: {
        lessonId: lesson.id,
        title: `Bài Luyện Viết`,
        description: `Bài tập rèn luyện kỹ năng viết và ngữ pháp - ${lesson.title}`,
        ceftLevel: level
      }
    });
    await prisma.question.create({
      data: {
        testId: writeTest.id,
        quesionText: `Viết một đoạn văn ngắn (50-100 từ) giới thiệu về bản thân hoặc chủ đề liên quan.`,
        questionType: 'writing',
        points: 10,
        skillCategory: 'Writing',
        difficultyElo: 1200
      }
    });
  }
  
  console.log("Seeding Tests hoàn tất!");
}

reseedTests()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
