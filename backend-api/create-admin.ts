import 'dotenv/config';
import { prisma } from './src/config/prisma.js';
import { permissionService } from './src/module/permission/permission.service.js';

async function main() {
  await permissionService.initRolesAndPermissions();
  await prisma.user.upsert({
    where: { email: 'aligon922024@gmail.com' },
    update: { roleId: 1 },
    create: {
      username: 'aligon922024',
      email: 'aligon922024@gmail.com',
      passwordHash: 'FACEBOOK_AUTH_NO_PASSWORD',
      roleId: 1,
      xpPoints: 0
    }
  });
  console.log('Tạo/Cập nhật tài khoản Admin thành công!');
}
main().catch(console.error).finally(() => prisma.$disconnect());
