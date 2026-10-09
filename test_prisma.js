const { PrismaClient } = require('./backend-api/src/generated/prisma/index.js');
const prisma = new PrismaClient();
async function test() {
  try {
    const randomWords = await prisma.$queryRawUnsafe('SHOW TABLES');
    console.log(randomWords);
  } catch(e) {
    console.error('Error 1:', e);
  }
}
test();
