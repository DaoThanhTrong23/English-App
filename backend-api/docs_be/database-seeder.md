# 🌰 Hướng Dẫn Sử Dụng Database Seeder (Prisma)

Tài liệu này hướng dẫn cách cấu hình, khởi chạy và mở rộng dữ liệu mẫu (Seeder) cho cơ sở dữ liệu dự án `backend-api`.

---

## 🎯 1. Mục Đích Của Seeder

Khi mới thiết lập dự án hoặc sau khi reset database, seeder giúp:
- Tự động tạo sẵn các tài khoản mặc định (**Admin**, **User test**).
- Cung cấp dữ liệu khởi tạo mẫu để test tính năng đăng nhập, phân quyền, làm bài test, học từ vựng,...
- Giúp các thành viên trong team có ngay môi trường dữ liệu đồng nhất mà không cần tạo thủ công qua API hoặc database UI.

---

## 🔑 2. Danh Sách Tài Khoản Mặc Định Đã Seed

File seeder tại [`src/prisma/seeder.ts`](file:///d:/English-App/backend-api/src/prisma/seeder.ts) cung cấp sẵn 2 tài khoản mẫu:

| Role | Username | Email | Mật khẩu mặc định | XP Points |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin@example.com` | `Admin@123456` | 100 |
| **User** | `user_test` | `user@example.com` | `User@123456` | 0 |

> 🔒 Mật khẩu được mã hóa an toàn bằng thuật toán `bcrypt` trước khi lưu vào database (`password_hash`).

---

## 🚀 3. Cách Chạy Seeder

Đảm bảo bạn đang đứng tại thư mục `backend-api` và cơ sở dữ liệu MySQL đã kết nối thành công:

```bash
cd backend-api
```

### Cách 1: Sử dụng npm script (Khuyên dùng)
```bash
npm run seed
```

### Cách 2: Sử dụng Prisma CLI
```bash
npx prisma db seed
```

---

## ⚙️ 4. Cấu Hình Hoạt Động (How it works)

1. **Cấu hình trong `package.json`**:
   ```json
   {
     "scripts": {
       "seed": "tsx src/prisma/seeder.ts"
     },
     "prisma": {
       "seed": "tsx src/prisma/seeder.ts"
     }
   }
   ```
2. **Sử dụng `tsx`**: Dự án sử dụng TypeScript và ESM (`"type": "module"`), `tsx` cho phép thực thi trực tiếp file TypeScript `src/prisma/seeder.ts` mà không cần biên dịch trước.

---

## 🛠️ 5. Hướng Dẫn Mở Rộng & Thêm Dữ Liệu Mẫu

### 5.1. Quy tắc sử dụng `upsert`
Khi viết seed data, hãy ưu tiên dùng **`prisma.<model>.upsert()`** thay vì `create()` để tránh bị lỗi trùng khóa chính (`Unique constraint failed`) khi chạy lệnh seed nhiều lần:

```typescript
await prisma.user.upsert({
  where: { email: "newuser@example.com" },
  update: {}, // Không thay đổi gì nếu đã tồn tại
  create: {
    username: "newuser",
    email: "newuser@example.com",
    passwordHash: hashedPassword,
    role: Role.user,
    xpPoints: 0,
  },
});
```

### 5.2. Tách nhỏ seeder theo từng module (Khuyên dùng khi dự án lớn)
Khi dự án có nhiều bảng dữ liệu (từ vựng, bài kiểm tra, thành tựu...), bạn có thể tổ chức cấu trúc như sau:

```text
src/prisma/
├── schema.prisma
├── seeder.ts             # File chạy chính gọi các seed con
└── seeds/
    ├── user.seed.ts      # Seed tài khoản
    ├── category.seed.ts  # Seed danh mục bài học
    └── question.seed.ts  # Seed câu hỏi / bài tập
```

**Ví dụ viết file `src/prisma/seeder.ts` tổng hợp:**
```typescript
import { seedUsers } from "./seeds/user.seed.js";
import { seedCategories } from "./seeds/category.seed.js";
import { prisma } from "../config/prisma.js";

async function main() {
  console.log("🌱 Bắt đầu seeding toàn bộ hệ thống...");
  await seedUsers();
  await seedCategories();
  console.log("✅ Hoàn tất seeding!");
}

main()
  .catch((e) => {
    console.error("❌ Lỗi seeder:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## ❓ 6. Xử Lý Sự Cố Thường Gặp (Troubleshooting)

1. **Lỗi `Cannot find module .../generated/prisma`**:
   - Chạy lệnh `npx prisma generate` để sinh lại Prisma Client trước khi chạy seed.
2. **Lỗi `Can't reach database server`**:
   - Kiểm tra lại MySQL Server và biến `DATABASE_URL` trong file `.env`.
