import 'dotenv/config';
import { prisma } from './src/config/prisma.js';
async function main() {
  await prisma.user.update({
    where: { email: 'aligon922024@gmail.com' },
    data: {
      passwordHash: '$2b$10$lOX02NfVCvuVTEWXIK1cj.K85DQ5dw.3go7Jo48arBr5nXEc9h2HO'
    }
  });
  console.log('C?p nh?t m?t kh?u thành công!');
}
main().catch(console.error).finally(() => prisma.$disconnect());
