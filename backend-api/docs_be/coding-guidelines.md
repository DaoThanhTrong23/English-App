# 📚 Quy Chuẩn Lập Trình & Viết Code Nghiệp Vụ (Backend API Guide)

Tài liệu này quy định các nguyên tắc, chuẩn mực kiến trúc và luồng xử lý khi phát triển các tính năng (module nghiệp vụ) trong `backend-api`.

---

## 🎯 1. Nguyên Tắc Cốt Lõi: Tối Ưu Hóa & Tự Động Hóa (DRY)

> 🛑 **QUY TẮC VÀNG:** Những thành phần đã được **tự động hóa ở tầng Middleware/Global Handler** thì **TUYỆT ĐỐI KHÔNG ĐƯỢC VIẾT LẠI** thủ công trong các tầng nghiệp vụ (`Controller`, `Service`, `Repository`).

### Các thành phần ĐÃ ĐƯỢC TỰ ĐỘNG HÓA trong dự án:

1. **Xác thực dữ liệu (Data Validation):**
   - **Tự động bởi:** Middleware `validate(schema)` (`src/middleware/validate.middleware.ts`) và `errorHandler` (`src/shared/http/error-handler.ts`).
   - **Cơ chế:** Middleware tự động parse `req.body`, `req.query`, `req.params` qua Zod Schema. Nếu vi phạm, `ZodError` được ném ra và `errorHandler` tự động trả về phản hồi HTTP **422 Unprocessable Entity** kèm chi tiết lỗi `validation_error`.
   - **Cấm:** Không được viết `if (!email) throw error`, không dùng `regex` kiểm tra định dạng email/phone thủ công trong Service, không bọc `try/catch` để bắt lỗi validate trong Controller/Service.

2. **Xử lý lỗi hệ thống & Ngoại lệ (Global Error Handling):**
   - **Tự động bởi:** `errorHandler` trong `src/shared/http/error-handler.ts`.
   - **Cơ chế:** Tự động bắt `ApiError` (trả về mã lỗi HTTP 400, 401, 403, 404... tương ứng) và các lỗi runtime chưa lường trước (trả về HTTP **500 Internal Error** kèm ghi log qua Pino).
   - **Cấm:** Không bọc `try...catch` ở mọi controller/service chỉ để `console.log` hoặc trả về HTTP 500.

3. **Xác thực người dùng & Phân quyền (Authentication & Authorization):**
   - **Tự động bởi:** Middleware `authenticate` (`src/middleware/authenticate.middleware.ts`) và `authorize(...roles)` (`src/middleware/authorize.middleware.ts`).
   - **Cơ chế:** Kiểm tra JWT Access Token, giải mã và gắn thông tin user vào `req.user`.
   - **Cấm:** Không tự parse Header `Authorization` hoặc tự query DB kiểm tra role thủ công trong hàm nghiệp vụ Service.

4. **Bảo mật & Giới hạn tải (Security & Rate Limiting):**
   - **Tự động bởi:** `helmet`, `cors`, `rateLimit`, `express.json({ limit: '100kb' })` cấu hình sẵn trong `app.ts`.

---

## 🏗️ 2. Cấu Trúc 4 Tầng Của Một Module Nghiệp Vụ (Module Layering)

Mỗi module nghiệp vụ nằm trong thư mục `src/module/<tên-module>/` phải tuân thủ cấu trúc 4 file chính:

```text
src/module/<module-name>/
├── <module>.schema.ts      # 1. Định nghĩa Zod Schema (Validate Input/Output)
├── <module>.route.ts       # 2. Khai báo Endpoint, gắn Middleware & Route Handler
├── <module>.service.ts     # 3. Xử lý Logic Nghiệp vụ chính
└── <module>.repository.ts  # 4. Thao tác Cơ sở dữ liệu (Prisma Client)
```

---

## 📋 3. Chi Tiết Nhiệm Vụ Của Từng Tầng & Code Mẫu

### 🔹 Tầng 1: `*.schema.ts` (Định nghĩa Schema)
Chỉ khai báo cấu trúc dữ liệu đầu vào/đầu ra với **Zod**.

```typescript
import { z } from "zod";

export const CreateUserSchema = z.object({
  body: z.object({
    email: z.string().email("Email không hợp lệ"),
    password: z.string().min(6, "Mật khẩu phải từ 6 ký tự trở lên"),
    fullName: z.string().min(1, "Họ tên không được để trống")
  }),
  query: z.object({}),
  params: z.object({})
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
```

---

### 🔹 Tầng 2: `*.route.ts` (Định nghĩa Endpoint & Gắn Middleware)
Khai báo router, gắn các middleware tự động hóa (`authenticate`, `authorize`, `validate`).

```typescript
import { Router } from "express";
import { validate } from "../../middleware/validate.middleware.js";
import { authenticate } from "../../middleware/authenticate.middleware.js";
import { CreateUserSchema } from "./user.schema.js";
import * as userController from "./user.controller.js";

const router = Router();

// Gắn validate(CreateUserSchema) -> Dữ liệu đầu vào ĐÃ ĐƯỢC TỰ ĐỘNG LÀM SẠCH VÀ VALIDATE
router.post(
  "/",
  authenticate,
  validate(CreateUserSchema),
  userController.createUserHandler
);

export default router;
```

---

### 🔹 Tầng 3: `*.service.ts` (Xử lý Nghiệp Vụ)
Chỉ tập trung vào **nghiệp vụ kinh doanh** (Business Logic). Không validate lại dữ liệu. Nếu vi phạm quy tắc nghiệp vụ (ví dụ: trùng email), ném lỗi `ApiError`.

```typescript
import { ApiError } from "../../shared/http/api-error.js";
import * as userRepository from "./user.repository.js";

export const createUserService = async (data: { email: string; password: string; fullName: string }) => {
  // ❌ KHÔNG VIẾT: if (!data.email) throw new Error("Thiếu email") -> Đã được Zod validate tự động!

  // 1. Kiểm tra quy tắc nghiệp vụ (Business Rule)
  const existingUser = await userRepository.findUserByEmail(data.email);
  if (existingUser) {
    throw new ApiError(400, "email_already_exists", "Email này đã được sử dụng.");
  }

  // 2. Thực thi nghiệp vụ (Mã hóa pass, tạo user...)
  const newUser = await userRepository.insertUser(data);
  return newUser;
};
```

---

### 🔹 Tầng 4: `*.repository.ts` (Thao tác Database)
Chỉ gọi Prisma Client để truy vấn CSDL.

```typescript
import { prisma } from "../../prisma/client.js";

export const findUserByEmail = (email: string) => {
  return prisma.user.findUnique({ where: { email } });
};

export const insertUser = (data: any) => {
  return prisma.user.create({ data });
};
```

---

## 🚫 4. Danh Sách Anti-Patterns (Những Điều Cấm Làm)

| Anti-Pattern (Cách làm sai) | Cách làm đúng (Theo tiêu chuẩn) |
| :--- | :--- |
| Self-validate trong Controller/Service: `if (!req.body.email) return res.status(400)...` | Dùng `validate(ZodSchema)` ở Route. Controller nghiễm nhiên nhận được data chuẩn. |
| Bọc `try-catch` trong mọi hàm Controller và trả về `res.status(500).json(...)` | Không bọc `try-catch` thừa. Để `errorHandler` tự động bắt lỗi và log. |
| Tự parse JWT token trong hàm Service: `jwt.verify(req.headers.token...)` | Dùng `authenticate` middleware. Đọc thông tin từ `req.user`. |
| Query DB kiểm tra role trong Service: `if (user.role !== 'ADMIN')...` | Dùng `authorize(['ADMIN'])` middleware ở Route. |

---

## 🛠️ 5. Quy Trình Tạo Một Feature Mới (Checklist)

1. [ ] **Khai báo Schema:** Tạo Zod schema trong `*.schema.ts`.
2. [ ] **Viết DB Query:** Tạo các hàm trong `*.repository.ts`.
3. [ ] **Viết Business Logic:** Viết hàm trong `*.service.ts` (ném `ApiError` nếu vi phạm nghiệp vụ).
4. [ ] **Viết Controller/Handler:** Nhận `req`, gọi service, trả `res.json()`.
5. [ ] **Đăng ký Route:** Khai báo route trong `*.route.ts`, truyền middleware `validate(schema)`.
