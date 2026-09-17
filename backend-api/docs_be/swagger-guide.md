# 📖 Hướng Dẫn Sử Dụng & Cập Nhật Swagger API Documentation (OpenAPI 3.0)

Tài liệu này hướng dẫn cách truy cập, sử dụng và tự động cập nhật tài liệu API **Swagger (OpenAPI 3.0)** trong dự án `backend-api`.

---

## 🌐 1. Truy Cập Giao Diện Swagger UI

Sau khi khởi động server backend (`npm run dev` hoặc `npm run start`), bạn có thể mở tài liệu API trực quan trên trình duyệt tại:

👉 **URL:** [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

---

## 🔑 2. Hướng Dẫn Xác Thực & Test API Trên Swagger UI

### 2.1. Đăng nhập & Lấy Access Token
1. Tìm đến nhóm **Auth** trên giao diện Swagger.
2. Mở API `POST /api/auth/login`.
3. Bấm **Try it out**, điền thông tin tài khoản (ví dụ tài khoản admin) và bấm **Execute**.
4. Copy chuỗi `accessToken` từ phần phản hồi (Response Body).

### 2.2. Gắn Token vào Swagger (Authorize)
1. Kéo lên đầu trang Swagger UI, bấm vào nút **🔓 Authorize** (màu xanh lá ở góc phải).
2. Dán token đã copy vào ô Value theo cú pháp:
   ```text
   Bearer <access_token_cua_ban>
   ```
3. Bấm nút **Authorize** rồi bấm **Close**.
4. Lúc này, tất cả các API yêu cầu quyền đăng nhập (`requireAuth`) hoặc quyền Admin (`authorize(["admin"])`) như **Quản lý Khóa học**, **Quản lý Học viên**, **Quản lý Từ vựng**... đều sẽ tự động đính kèm Token khi bạn test.

---

## ⚙️ 3. Cơ Chế Tự Động Hóa Của Swagger

Dự án áp dụng cơ chế **tự động sinh tài liệu 100% từ Express Route và Zod Schema**:
- **Tự động quét Route:** Phát hiện toàn bộ URL endpoint và HTTP Method (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`...).
- **Tự động nạp Zod Schema:** Trích xuất chi tiết kiểu dữ liệu, các trường bắt buộc (`required`), độ dài tối thiểu/tối đa (`minLength`, `maxLength`), regex, enum... từ `*.schema.ts` thành **JSON Request Body** và **Query/Path Parameters** chuẩn OpenAPI 3.0.
- **Không cần viết chú thích JSDoc thủ công** trên từng controller/route.

---

## 🚀 4. Cách Cập Nhật Tài Liệu Khi Viết API Mới

Mỗi khi bạn thêm hoặc chỉnh sửa bất kỳ endpoint/schema nào trong mã nguồn:

### Bước 1: Khai báo vào `src/swagger-gen.ts` (Nếu tạo module mới)
Mở file [`src/swagger-gen.ts`](file:///d:/English-App/backend-api/src/swagger-gen.ts), import Zod Schema của bạn và thêm vào mảng `routeSchemaMap`:

```typescript
// Ví dụ: Thêm module mới
import { CreateTestSchema, GetTestsQuerySchema } from "./module/test/test.schema.js";

// Thêm vào routeSchemaMap:
const routeSchemaMap = {
  // ... các route hiện có
  "/api/admin/tests": {
    get: { schema: GetTestsQuerySchema, summary: "Lấy danh sách bài kiểm tra", tags: ["Admin - Tests"] },
    post: { schema: CreateTestSchema, summary: "Tạo bài kiểm tra mới", tags: ["Admin - Tests"] },
  },
};
```

### Bước 2: Chạy lệnh sinh tài liệu
Mở terminal và chạy lệnh:
```bash
npm run swagger
```

Hệ thống sẽ tự động quét lại toàn bộ router và Zod schemas, sau đó cập nhật file [`src/swagger-output.json`](file:///d:/English-App/backend-api/src/swagger-output.json). Giao diện Swagger tại `/api-docs` sẽ cập nhật các thay đổi mới ngay lập tức!

---

## 🏗️ 5. Cấu Trúc Các File Liên Quan Đến Swagger

```text
backend-api/
├── src/
│   ├── swagger-gen.ts        # Script tự động quét route & convert Zod schemas sang OpenAPI 3.0
│   ├── swagger-output.json   # File cấu trúc dữ liệu OpenAPI 3.0 được sinh ra tự động
│   └── app.ts                # Khởi tạo Express và mount Swagger UI tại endpoint /api-docs
├── docs_be/
│   └── swagger-guide.md      # Tài liệu hướng dẫn sử dụng Swagger (File này)
└── package.json              # Chứa lệnh "npm run swagger"
```

---

## ❓ 6. Khắc Phục Sự Cố Thường Gặp (Troubleshooting)

| Vấn đề | Nguyên nhân | Cách khắc phục |
| :--- | :--- | :--- |
| **Không thấy các trường Body JSON khi bấm "Try it out"** | File `swagger-output.json` chưa được cập nhật sau khi sửa Schema | Chạy lệnh `npm run swagger` trong terminal để sinh lại tài liệu. |
| **Báo lỗi 401 Unauthorized khi test API trên Swagger** | Chưa gắn Token vào nút Authorize hoặc Token đã hết hạn | Đăng nhập lại qua API `/api/auth/login`, copy accessToken mới và dán vào nút **Authorize** với tiền tố `Bearer `. |
| **API mới tạo chưa xuất hiện trên Swagger** | Quên đăng ký route trong `src/app.ts` hoặc chưa chạy lại lệnh swagger | Đảm bảo route đã được `app.use(...)` trong `src/app.ts` và chạy `npm run swagger`. |
