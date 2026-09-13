import 'dotenv/config';
import { prisma } from './src/config/prisma.js';
async function main() {
  await prisma.user.create({
    data: {
      username: 'aligon922024',
      email: 'aligon922024@gmail.com',
      passwordHash: 'FACEBOOK_AUTH_NO_PASSWORD',
      role: 'admin',
      xpPoints: 0
    }
  });
  console.log('T?o tài kho?n Admin thành công!');
}
main().catch(console.error).finally(() => prisma.$disconnect());
