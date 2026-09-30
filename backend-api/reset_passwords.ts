import { prisma } from './src/config/prisma.js';
import bcrypt from 'bcrypt';

async function main() {
  const plainPassword = 'P@ssword01';
  const saltRounds = 10;
  
  console.log(`Bắt đầu tạo mã Hash cho mật khẩu: ${plainPassword}`);
  const hash = await bcrypt.hash(plainPassword, saltRounds);
  
  console.log('Đang cập nhật mật khẩu cho toàn bộ User trong Database...');
  const result = await prisma.user.updateMany({
    data: {
      passwordHash: hash
    }
  });
  
  console.log(`✅ Thành công! Đã reset mật khẩu cho ${result.count} tài khoản.`);
}

main()
  .catch(e => {
    console.error('❌ Lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
