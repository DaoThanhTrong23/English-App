import { PrismaClient } from "../generated/prisma/index.js";
import { bcryptHash } from "../utils/hash.js";
import { permissionService } from "../module/permission/permission.service.js";

const prisma = new PrismaClient();

async function main() {
  console.log("Bắt đầu seeding dữ liệu Roles, Permissions và tài khoản mẫu...");

  // 1. Khởi tạo / Đồng bộ Roles & Permissions
  await permissionService.initRolesAndPermissions();

  // Hash mật khẩu mẫu
  const adminPasswordHash = await bcryptHash("Admin@123");
  const userPasswordHash = await bcryptHash("User@123");

  // 2. Tạo tài khoản Admin (roleId = 1)
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { roleId: 1 },
    create: {
      username: "admin",
      email: "admin@example.com",
      passwordHash: adminPasswordHash,
      roleId: 1,
      xpPoints: 100,
    },
  });

  // 3. Tạo tài khoản User thông thường (roleId = 2)
  const testUser = await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: { roleId: 2 },
    create: {
      username: "user_test",
      email: "user@example.com",
      passwordHash: userPasswordHash,
      roleId: 2,
      xpPoints: 0,
    },
  });

  console.log(" Seed thành công:");
  console.log(` - Admin: ${admin.email} (Username: ${admin.username})`);
  console.log(` - User:  ${testUser.email} (Username: ${testUser.username})`);
}

main()
  .catch((e) => {
    console.error(" Lỗi khi seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });