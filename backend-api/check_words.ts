import { PrismaClient } from './src/generated/prisma/index.js';
const prisma = new PrismaClient();

async function checkWords() {
  const words = await prisma.word.findMany({ take: 5 });
  console.log(words.map(w => w.audioUrl));
}

checkWords()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
