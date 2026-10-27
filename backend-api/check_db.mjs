import { PrismaClient } from './src/generated/prisma/index.js';
const prisma = new PrismaClient();

async function main() {
  const dl = await prisma.lesson.findMany({ where: { deletedAt: { not: null } } });
  console.log('Deleted lessons:', dl.length, dl.map(l => ({ id: l.id, title: l.title, topicId: l.topicId })));
  const dt = await prisma.topic.findMany({ where: { deletedAt: { not: null } } });
  console.log('Deleted topics:', dt.length, dt.map(t => ({ id: t.id, title: t.title })));
}

main().finally(() => prisma.$disconnect());
