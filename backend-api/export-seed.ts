import { PrismaClient } from './src/generated/prisma/index.js';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching data from DB...');
  const topics = await prisma.topic.findMany();
  const lessons = await prisma.lesson.findMany();
  const words = await prisma.word.findMany();
  const lessonWords = await prisma.lessonWord.findMany();
  const tests = await prisma.test.findMany();
  const questions = await prisma.question.findMany();
  const answers = await prisma.answer.findMany();
  const achievements = await prisma.achievement.findMany();
  const games = await prisma.game.findMany();
  const gameSettings = await prisma.gameSetting.findMany();

  const data = {
    topics, lessons, words, lessonWords, tests, questions, answers, achievements, games, gameSettings
  };

  fs.writeFileSync('src/prisma/seed-data.json', JSON.stringify(data, null, 2));
  console.log('Saved to src/prisma/seed-data.json');
}

main().catch(console.error).finally(() => prisma.$disconnect());
