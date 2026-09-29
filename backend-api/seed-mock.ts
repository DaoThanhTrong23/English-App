import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  console.log('1. Dang tao du lieu Hoc vien (de test Leaderboard)...');
  const user1 = await prisma.user.upsert({
    where: { email: 'top1@example.com' },
    update: { xpPoints: 9500 },
    create: {
      username: 'YasuoThongThao7',
      email: 'top1@example.com',
      passwordHash: 'hashed_password',
      role: 'user',
      xpPoints: 9500,
    },
  });
  const user2 = await prisma.user.upsert({
    where: { email: 'top2@example.com' },
    update: { xpPoints: 8200 },
    create: {
      username: 'HocTiengAnhChamChi',
      email: 'top2@example.com',
      passwordHash: 'hashed_password',
      role: 'user',
      xpPoints: 8200,
    },
  });

  console.log('2. Dang tao Chu de (Topic)...');
  const topic1 = await prisma.topic.create({
    data: {
      title: 'Tieng Anh Cong So',
      description: 'Giao tiep co ban moi truong lam viec',
      cefrLevel: 'A2',
    },
  });

  console.log('3. Dang tao Bai hoc (Lesson) thuoc Chu de...');
  const lesson1 = await prisma.lesson.create({
    data: {
      title: 'Bai 1: Phong van xin viec',
      description: 'Hoc cach tra loi phong van troi chay',
      cefrLevel: 'A2',
      topicId: topic1.id,
    },
  });

  console.log('4. Dang tao Tu vung (Word) & Gan vao Bai hoc...');
  await prisma.word.create({
    data: {
      headword: 'Interview',
      meaning: 'Cuoc phong van',
      partOfSpeech: 'noun',
      cefrLevel: 'A2',
      lessonWords: {
        create: { lessonId: lesson1.id }
      }
    },
  });

  console.log('5. Dang tao Bai test ky nang thuoc Bai hoc...');
  await prisma.test.create({
    data: {
      title: 'Bai Luyen Nghe - Phong van xin viec',
      description: 'Nghe ki cau hoi cua nha tuyen dung',
      ceftLevel: 'A2',
      lessonId: lesson1.id,
      questions: {
        create: [
          {
            quesionText: 'What should you bring to a job interview?',
            questionType: 'multiple_choice',
            points: 10,
            answers: {
              create: [
                { answerText: 'A copy of your resume', isCorrect: true },
                { answerText: 'Your pet', isCorrect: false },
              ]
            }
          }
        ]
      }
    },
  });

  console.log('6. Dang tao Hoi thoai AI Chat (Mock data)...');
  const session = await prisma.aiChatSession.create({
    data: {
      userId: user1.id,
      title: 'Sua loi phat am',
      messages: {
        create: [
          {
            sessionId: 0,
            sender: 'user',
            messageText: 'AI giup toi kiem tra loi ngu phap cau nay voi: "I has a apple".',
          },
          {
            sessionId: 0,
            sender: 'ai',
            messageText: 'Cau dung phai la "I have an apple" nhe!',
          }
        ]
      }
    }
  });

  await prisma.aiChatMessage.updateMany({
    where: { aiChatSessionId: session.id },
    data: { sessionId: session.id }
  });

  console.log('Hoan thanh import du lieu mau!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
