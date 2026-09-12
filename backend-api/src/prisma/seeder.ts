
import { PrismaClient, Role } from "../generated/prisma/index.js";
import { bcryptHash } from "../utils/hash.js";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Bắt đầu seeding dữ liệu tài khoản...");

  // Hash mật khẩu mẫu
  const adminPasswordHash = await bcryptHash("Admin@123")
  const userPasswordHash =  await bcryptHash("User@123")

  // 1. Tạo tài khoản Admin (dùng upsert để nếu đã có rồi thì không bị lỗi trùng lặp)
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      username: "admin",
      email: "admin@example.com",
      passwordHash: adminPasswordHash,
      role: Role.admin,
      xpPoints: 100,
    },
  });

  // 2. Tạo tài khoản User thông thường
  const testUser = await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: {
      username: "user_test",
      email: "user@example.com",
      passwordHash: userPasswordHash,
      role: Role.user,
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