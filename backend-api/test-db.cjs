const { PrismaClient } = require('./src/generated/prisma/index.js');
const prisma = new PrismaClient();
prisma.word.findFirst({ where: { headword: 'abnormally' } })
  .then(w => console.log(w))
  .finally(() => prisma.$disconnect());
