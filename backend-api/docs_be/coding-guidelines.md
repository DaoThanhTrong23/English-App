# 📚 Quy Chuẩn Lập Trình & Viết Code Nghiệp Vụ (Backend API Guide)

Tài liệu này quy định các nguyên tắc, chuẩn mực kiến trúc và luồng xử lý khi phát triển các tính năng (module nghiệp vụ) trong `backend-api`.

---

## 🎯 1. Nguyên Tắc Cốt Lõi: Tối Ưu Hóa & Tự Động Hóa (DRY)

> 🛑 **QUY TẮC VÀNG:** Những thành phần đã được **tự động hóa ở tầng Middleware/Global Handler/AOP Decorators** thì **TUYỆT ĐỐI KHÔNG ĐƯỢC VIẾT LẠI** thủ công trong các tầng nghiệp vụ (`Controller`, `Service`, `Repository`).

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

4. **Ghi log thực thi & Đo hiệu năng (Execution Logging & Performance Audit):**
   - **Tự động bởi:** AOP Decorator `@logExecution()` (`src/shared/decorators/log.decorator.ts`).
   - **Cơ chế:** Tự động ghi log trước/sau khi hàm chạy (`[AOP BEFORE]`, `[AOP AFTER]`), đo thời gian thực thi (duration ms) và ghi nhận lỗi nếu xảy ra.
   - **Cấm:** Không tự viết code bấm thời gian (`Date.now()`) hoặc `loggers.info` thủ công ở từng hàm service để đo performance.

5. **Bảo mật & Giới hạn tải (Security & Rate Limiting):**
   - **Tự động bởi:** `helmet`, `cors`, `rateLimit`, `express.json({ limit: '100kb' })` cấu hình sẵn trong `app.ts`.

---

## 🌀 2. Aspect-Oriented Programming (AOP - Lập Trình Hướng Khía Cạnh)

AOP là kỹ thuật tách biệt các **Cross-Cutting Concerns** (các mối quan tâm dùng chung) ra khỏi logic nghiệp vụ chính.

Trong dự án `backend-api`, AOP được chia làm **2 cấp độ**:

### 🅰️ AOP Tầng HTTP Request (Express Middleware Interceptors)
Tự động can thiệp vào luồng xử lý HTTP trước và sau khi tới Controller:
- **Validation Aspect:** `validate(schema)` intercept và validate dữ liệu.
- **Security & Auth Aspect:** `authenticate`, `authorize` intercept kiểm tra quyền hạn.
- **Exception Aspect:** `errorHandler` intercept bắt mọi ngoại lệ trôi ra ngoài.
- **HTTP Logging Aspect:** `pinoHttp` tự động log thông tin các request/response HTTP.

### 🅱️ AOP Tầng Method / Service (TypeScript Decorators)
Can thiệp trực tiếp vào các phương thức (methods) của Class ở tầng Service/Repository mà không làm ô nhiễm code nghiệp vụ:
- **`@logExecution()`** ([log.decorator.ts](file:///d:/English-App/backend-api/src/shared/decorators/log.decorator.ts)): Tự động đo thời gian chạy (ms), ghi log input (đã ẩn mật khẩu), log kết quả và log lỗi.
- **`@recordActivity()`** ([activity.decorator.ts](file:///d:/English-App/backend-api/src/shared/decorators/activity.decorator.ts)): Tự động ghi activity log vào database MySQL ở background khi người dùng thao tác.

> 📖 Xem hướng dẫn chi tiết toàn diện tại: [aop-guide.md](file:///d:/English-App/backend-api/docs_be/aop-guide.md)

#### Ví dụ sử dụng AOP Decorator trong Service:

```typescript
import { logExecution } from "../../shared/decorators/log.decorator.js";
import { recordActivity } from "../../shared/decorators/activity.decorator.js";

export class UserService {
  // Gắn decorator @logExecution() và @recordActivity()
  @logExecution()
  @recordActivity("USER_DO_SOMETHING", (result, userId) => `Người dùng ${userId} thực hiện thành công`)
  async processComplexBusiness(userId: number, amount: number) {
    // 🟢 CHỈ VIẾT LOGIC NGHIỆP VỤ CHÍNH TẠI ĐÂY
    // Không cần viết loggers.info("Start function..."), không cần tính Date.now()
    const result = await this.repository.doSomething(userId, amount);
    return result;
  }
}
```

---

## 🏗️ 3. Cấu Trúc 4 Tầng Của Một Module Nghiệp Vụ (Module Layering)

Mỗi module nghiệp vụ nằm trong thư mục `src/module/<tên-module>/` phải tuân thủ cấu trúc 4 file chính:

```text
src/module/<module-name>/
├── <module>.schema.ts      # 1. Định nghĩa Zod Schema (Validate Input/Output)
├── <module>.route.ts       # 2. Khai báo Endpoint, gắn Middleware & Route Handler
├── <module>.service.ts     # 3. Xử lý Logic Nghiệp vụ chính
└── <module>.repository.ts  # 4. Thao tác Cơ sở dữ liệu (Prisma Client)
```

---

## 📋 4. Chi Tiết Nhiệm Vụ Của Từng Tầng & Code Mẫu

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
Khai báo router, gắn các middleware tự động hóa (`authenticate`, `authorize`, `validate`), bọc qua `asyncHandler` và gọi phương thức từ service instance.

```typescript
import { Router } from "express";
import { validate } from "../../middleware/validate.middleware.js";
import { authenticate } from "../../middleware/authenticate.middleware.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { CreateUserSchema } from "./user.schema.js";
import { userService } from "./user.service.js";

const router = Router();

// Gắn validate(CreateUserSchema) -> Dữ liệu đầu vào ĐÃ ĐƯỢC TỰ ĐỘNG LÀM SẠCH VÀ VALIDATE
router.post(
  "/",
  authenticate,
  validate(CreateUserSchema),
  asyncHandler(async (req, res) => {
    const result = await userService.createUser(req.body);
    res.status(201).json({
      success: true,
      message: "Tạo tài khoản thành công",
      data: result,
    });
  })
);

export default router;
```

---

### 🔹 Tầng 3: `*.service.ts` (Xử lý Nghiệp Vụ - Class Dạng OOP)
- Viết dưới dạng **Class**, gắn decorator `@logExecution()` lên các method nghiệp vụ để tự động log tên hàm, args và thời gian chạy.
- Nhận hoặc gọi **Repository Instance** để thao tác DB.
- Ném lỗi `ApiError` khi vi phạm business rules.

```typescript
import { ApiError } from "../../shared/http/api-error.js";
import { logExecution } from "../../shared/decorators/log.decorator.js";
import { userRepository, UserRepository } from "./user.repository.js";
import { CreateUserInput } from "./user.schema.js";

export class UserService {
  constructor(private userRepo: UserRepository = userRepository) {}

  @logExecution()
  async createUser(data: CreateUserInput["body"]) {
    // ❌ KHÔNG VIẾT: if (!data.email) throw new Error("Thiếu email") -> Đã được Zod validate tự động!

    // 1. Kiểm tra quy tắc nghiệp vụ (Business Rule)
    const existingUser = await this.userRepo.findByEmail(data.email);
    if (existingUser) {
      throw new ApiError(409, "email_already_exists", "Email này đã được sử dụng.");
    }

    // 2. Thực thi nghiệp vụ (Mã hóa pass, tạo user...)
    const newUser = await this.userRepo.create(data);
    return newUser;
  }
}

// Export singleton instance để tái sử dụng
export const userService = new UserService();
```

---

### 🔹 Tầng 4: `*.repository.ts` (Thao tác Database - Class Dạng OOP)
- Viết dưới dạng **Class**, gom toàn bộ các truy vấn Prisma liên quan đến entity vào class này.
- Có thể gắn `@logExecution()` nếu muốn audit chi tiết thời gian query Database.

```typescript
import { prisma } from "../../config/prisma.js";
import { logExecution } from "../../shared/decorators/log.decorator.js";

export class UserRepository {
  @logExecution()
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  @logExecution()
  async findById(id: number) {
    return prisma.user.findUnique({ where: { id } });
  }

  @logExecution()
  async create(data: any) {
    return prisma.user.create({ data });
  }
}

// Export singleton instance để tái sử dụng
export const userRepository = new UserRepository();
```

---

## 🚫 5. Danh Sách Anti-Patterns (Những Điều Cấm Làm)

| Anti-Pattern (Cách làm sai) | Cách làm đúng (Theo tiêu chuẩn) |
| :--- | :--- |
| Self-validate trong Controller/Service: `if (!req.body.email) return res.status(400)...` | Dùng `validate(ZodSchema)` ở Route. Service nghiễm nhiên nhận được data chuẩn. |
| Bọc `try-catch` trong mọi hàm Controller và trả về `res.status(500).json(...)` | Không bọc `try-catch` thừa. Để `errorHandler` tự động bắt lỗi và log. |
| Tự parse JWT token trong hàm Service: `jwt.verify(req.headers.token...)` | Dùng `authenticate` middleware. Đọc thông tin từ `req.user`. |
| Query DB kiểm tra role trong Service: `if (user.role !== 'ADMIN')...` | Dùng `authorize(['ADMIN'])` middleware ở Route. |
| Viết mã đo thời gian thực thi `const start = Date.now()` thủ công ở từng hàm | Dùng AOP Decorator `@logExecution()` lên trên method trong Class cần theo dõi. |
| Viết các hàm rải rác không gom nhóm | Gom thành `Class` (Service Class, Repository Class) và export Singleton instance. |

---

## 🛠️ 6. Quy Trình Tạo Một Feature Mới (Checklist)

1. [ ] **Khai báo Schema:** Tạo Zod schema trong `*.schema.ts`.
2. [ ] **Viết DB Query (Repository Class):** Tạo `class <Module>Repository` trong `*.repository.ts` và export instance.
3. [ ] **Viết Business Logic (Service Class):** Tạo `class <Module>Service` trong `*.service.ts`, gắn `@logExecution()` lên các phương thức nghiệp vụ, ném `ApiError` khi vi phạm rule.
4. [ ] **Đăng ký Route:** Khai báo route trong `*.route.ts`, bọc qua `asyncHandler`, truyền middleware `validate(schema)` và gọi service method.
