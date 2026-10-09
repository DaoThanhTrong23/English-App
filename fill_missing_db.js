const { PrismaClient } = require('./backend-api/src/generated/prisma/index.js');
const prisma = new PrismaClient();
async function main() {
  console.log('Mocking missing meanings...');
  await prisma.$executeRawUnsafe("UPDATE words SET meaning = CONCAT('Nghĩa của ', headword) WHERE meaning IS NULL OR meaning = ''");
  
  console.log('Mocking missing images...');
  await prisma.$executeRawUnsafe("UPDATE words SET image_url = 'https://via.placeholder.com/150' WHERE image_url IS NULL OR image_url = ''");
  
  console.log('Done!');
}
main();
