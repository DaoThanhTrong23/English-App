import { prisma } from './src/config/prisma.js';

const LEVELS = [
  {
    level: 'A1',
    topics: [
      { title: 'Chào hỏi và Giới thiệu', desc: 'Học cách chào hỏi và giới thiệu bản thân cơ bản.' },
      { title: 'Thói quen hàng ngày', desc: 'Mô tả các hoạt động thường ngày của bạn.' },
      { title: 'Đồ ăn và Thức uống', desc: 'Từ vựng và mẫu câu về đồ ăn, thức uống.' }
    ]
  },
  {
    level: 'A2',
    topics: [
      { title: 'Du lịch và Kỳ nghỉ', desc: 'Lên kế hoạch và kể về những chuyến đi.' },
      { title: 'Sức khỏe và Thể hình', desc: 'Nói về sức khỏe và các hoạt động thể thao.' },
      { title: 'Mua sắm', desc: 'Giao tiếp khi đi mua sắm, hỏi giá cả.' }
    ]
  },
  {
    level: 'B1',
    topics: [
      { title: 'Giáo dục và Nghề nghiệp', desc: 'Thảo luận về trường học và công việc tương lai.' },
      { title: 'Môi trường', desc: 'Các vấn đề về môi trường và bảo vệ thiên nhiên.' },
      { title: 'Công nghệ', desc: 'Công nghệ và sự ảnh hưởng đến đời sống.' }
    ]
  },
  {
    level: 'B2',
    topics: [
      { title: 'Truyền thông và Tin tức', desc: 'Bàn luận về tin tức và các phương tiện truyền thông.' },
      { title: 'Xã hội và Văn hóa', desc: 'Văn hóa và các vấn đề xã hội đương đại.' },
      { title: 'Kinh doanh và Kinh tế', desc: 'Kinh doanh, tài chính và kinh tế.' }
    ]
  },
  {
    level: 'C1',
    topics: [
      { title: 'Nghệ thuật và Văn học', desc: 'Nghệ thuật, văn học và phê bình.' },
      { title: 'Khoa học và Đổi mới', desc: 'Khoa học và những đột phá công nghệ.' },
      { title: 'Các vấn đề toàn cầu', desc: 'Các vấn đề toàn cầu và chính sách quốc tế.' }
    ]
  },
  {
    level: 'C2',
    topics: [
      { title: 'Triết học và Đạo đức', desc: 'Triết học và các chuẩn mực đạo đức.' },
      { title: 'Ngôn ngữ học chuyên sâu', desc: 'Ngôn ngữ học chuyên sâu và sắc thái ngữ nghĩa.' },
      { title: 'Quan hệ quốc tế', desc: 'Quan hệ quốc tế và ngoại giao toàn cầu.' }
    ]
  }
];

async function seed() {
  console.log("Đang xóa dữ liệu bài học và chủ đề cũ...");
  await prisma.test.deleteMany({});
  await prisma.lesson.deleteMany({});
  await prisma.topic.deleteMany({});
  
  // Lấy tất cả từ vựng để map
  const allWords = await prisma.word.findMany({ select: { id: true, cefrLevel: true } });
  const wordsByLevel = {};
  for (const w of allWords) {
    const lvl = w.cefrLevel || 'A1';
    if (!wordsByLevel[lvl]) wordsByLevel[lvl] = [];
    wordsByLevel[lvl].push(w.id);
  }

  for (const lvlData of LEVELS) {
    const level = lvlData.level;
    const availableWords = wordsByLevel[level] || wordsByLevel['A1'] || [];

    for (let t = 0; t < lvlData.topics.length; t++) {
      const topicData = lvlData.topics[t];
      
      const topic = await prisma.topic.create({
        data: {
          title: topicData.title,
          description: topicData.desc,
          cefrLevel: level
        }
      });
      console.log(`Đã tạo Topic: ${topic.title} (${level})`);

      for (let l = 1; l <= 2; l++) {
        const lessonContent = `
          <h2>Bài học ${l}: ${topic.title}</h2>
          <p>This is a comprehensive lesson covering vocabulary, reading, listening, writing, and speaking for the topic <b>${topic.title}</b>.</p>
          <p>Please review the vocabulary carefully before taking the test.</p>
        `;

        const lesson = await prisma.lesson.create({
          data: {
            topicId: topic.id,
            title: `Lesson ${l}: ${topicData.title} - Part ${l}`,
            description: `Bài học toàn diện phần ${l} về ${topicData.title}. Bao gồm Nghe, Nói, Đọc, Viết và Từ vựng.`,
            content: lessonContent,
            cefrLevel: level,
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' // Dummy
          }
        });

        // Add 5 random vocabulary words
        const wordsToLink = [];
        if (availableWords.length > 0) {
          for (let w = 0; w < Math.min(5, availableWords.length); w++) {
            const randIdx = Math.floor(Math.random() * availableWords.length);
            wordsToLink.push({
              lessonId: lesson.id,
              wordId: availableWords[randIdx]
            });
          }
          try {
            await prisma.lessonWord.createMany({
              data: wordsToLink,
              skipDuplicates: true
            });
          } catch(e) {}
        }

        // Create a Test for this lesson
        const test = await prisma.test.create({
          data: {
            lessonId: lesson.id,
            title: `Bài tập thực hành - ${lesson.title}`,
            description: `Kiểm tra toàn diện 4 kỹ năng Nghe, Nói, Đọc, Viết`,
            ceftLevel: level
          }
        });

        // Add 4 questions covering the skills
        await prisma.question.createMany({
          data: [
            {
              testId: test.id,
              quesionText: `Đọc đoạn văn sau và chọn ý chính: "This topic covers ${topic.title}..."`,
              questionType: 'multiple_choice',
              points: 10,
              skillCategory: 'Reading',
              difficultyElo: 1200
            },
            {
              testId: test.id,
              quesionText: `Hãy nghe đoạn băng và điền từ còn thiếu.`,
              questionType: 'listening',
              points: 10,
              skillCategory: 'Listening',
              audioUrl: 'https://example.com/audio.mp3',
              difficultyElo: 1200
            },
            {
              testId: test.id,
              quesionText: `Phát âm từ vựng hoặc câu sau: "I am learning about ${topic.title}."`,
              questionType: 'speaking',
              points: 10,
              skillCategory: 'Speaking',
              difficultyElo: 1200
            },
            {
              testId: test.id,
              quesionText: `Viết một đoạn văn ngắn (50-100 từ) mô tả quan điểm của bạn về ${topic.title}.`,
              questionType: 'writing',
              points: 10,
              skillCategory: 'Writing',
              difficultyElo: 1200
            }
          ]
        });
        
        // Add Answers for the multiple choice question
        const mcq = await prisma.question.findFirst({
          where: { testId: test.id, questionType: 'multiple_choice' }
        });
        if (mcq) {
          await prisma.answer.createMany({
            data: [
              { questionId: mcq.id, answerText: `Ý chính là A`, isCorrect: true },
              { questionId: mcq.id, answerText: `Ý chính là B`, isCorrect: false },
              { questionId: mcq.id, answerText: `Ý chính là C`, isCorrect: false },
              { questionId: mcq.id, answerText: `Ý chính là D`, isCorrect: false }
            ]
          });
        }
      }
    }
  }
  
  console.log("Seeding hoàn tất!");
}

seed()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
