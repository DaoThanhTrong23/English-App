const { PrismaClient } = require('./backend-api/src/generated/prisma/index.js');
const prisma = new PrismaClient();
async function test() {
  const words = await prisma.$queryRawUnsafe("SELECT * FROM words WHERE meaning IS NULL OR meaning = '' LIMIT 5");
  console.log(words.map(w => w.headword + ' | img: ' + w.image_url));
}
test();
