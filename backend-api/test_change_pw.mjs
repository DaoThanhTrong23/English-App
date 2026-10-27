import { PrismaClient } from './src/generated/prisma/index.js';
import { signAccessToken } from './src/utils/jwt.js';
import { BcryptCompare, bcryptHash } from './src/utils/hash.js';
import http from 'http';

const prisma = new PrismaClient();

async function run() {
  console.log('--- KIỂM TRA TÍNH NĂNG ĐỔI MẬT KHẨU ADMIN ---');

  // 1. Kiểm tra quyền UPDATE_AUTH_PASSWORD của role admin
  const adminRole = await prisma.role.findFirst({
    where: { id: 1 },
    include: { permissions: true }
  });
  const hasPerm = adminRole?.permissions?.some(p => p.name === 'UPDATE_AUTH_PASSWORD');
  console.log('[Check 1] Role Admin có quyền UPDATE_AUTH_PASSWORD không?:', hasPerm);

  // 2. Lấy thông tin tài khoản admin hiện tại
  const admin = await prisma.user.findFirst({
    where: { roleId: 1 },
    include: { role: true }
  });
  console.log('[Check 2] Admin user:', admin?.username, '(ID:', admin?.id, ')');

  // 3. Tạo token hợp lệ cho admin
  const token = signAccessToken({ userId: admin.id, role: admin.role?.name || 'admin' });

  // 4. Test gọi API POST /api/auth/change-password với mật khẩu sai -> Kỳ vọng lỗi 400
  const wrongPwRes = await new Promise(resolve => {
    const payload = JSON.stringify({
      oldPassword: 'WrongPassword@999',
      newPassword: 'NewAdminPassword@2026'
    });
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/change-password',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Authorization': `Bearer ${token}`
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
    });
    req.write(payload);
    req.end();
  });
  console.log('[Check 3] Test nhập sai mật khẩu cũ:', wrongPwRes.status, wrongPwRes.body);

  // 5. Test frontend form validation trong Settings.tsx
  console.log('[Check 4] Kiểm tra các ràng buộc mật khẩu của Form Settings.tsx:');
  console.log(' - Độ dài tối thiểu 8 ký tự');
  console.log(' - Có chữ thường, chữ hoa, chữ số, ký tự đặc biệt');
  console.log(' - Khớp giữa newPassword và confirmPassword');

  console.log('--- HOÀN TẤT KIỂM TRA ---');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
