# 🚀 Hướng Dẫn Setup Backend (backend-api) Khi Clone Project

Tài liệu này hướng dẫn chi tiết các bước cần thực hiện để thiết lập và chạy nguồn backend (`backend-api`) sau khi clone dự án về máy local.

---

## 📋 1. Yêu Cầu Tiền Đề (Prerequisites)

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt các công cụ sau:
- **Node.js**: phiên bản `>= 18.x` (Khuyên dùng v20 LTS trở lên).
- **npm**: phiên bản `>= 9.x` (Đi kèm sẵn khi cài Node.js).
- **MySQL Database**: phiên bản `>= 8.0` (Có thể dùng MySQL Server cài trực tiếp, XAMPP, Laragon, hoặc Docker).

---

## 🛠️ 2. Các Bước Thực Hiện Chi Tiết

### 📂 Bước 1: Di chuyển vào thư mục backend
Mở terminal và di chuyển vào thư mục `backend-api`:
```bash
cd backend-api
```

---

### 📦 Bước 2: Cài đặt các thư viện phụ thuộc (Dependencies)
Chạy lệnh sau để tải và cài đặt các package trong `package.json`:
```bash
npm install
```

---

### ⚙️ Bước 3: Cấu hình biến môi trường (.env)

1. **Tạo file `.env` từ file mẫu `.env.example`**:
   - Trên **macOS / Linux**:
     ```bash
     cp .env.example .env
     ```
   - Trên **Windows (CMD / PowerShell)**:
     ```cmd
     copy .env.example .env
     ```

2. **Chỉnh sửa thông số trong `.env`**:
   Mở file `.env` vừa tạo và cập nhật các thông số phù hợp với máy local của bạn:

   ```env
   # Cổng chạy Backend Server
   PORT=3000

   # Domain Frontend cho phép truy cập (CORS)
   CORS_ORIGIN=http://localhost:8080

   # Mức độ Log (info, debug, warn, error)
   LOG_LEVEL=info

   # Chuỗi kết nối Database MySQL (Thay USER, PASSWORD, HOST, PORT, DATABASE_NAME tương ứng)
   DATABASE_URL=mysql://root:password@localhost:3306/english_app_db

   # Khóa bí mật mã hóa JWT Token (Access token & Refresh token)
   JWT_SECRET=your_super_secret_key_64_bytes
   JWT_EXPIRES_IN=900000ms

   JWT_REFRESH_SECRET=your_refresh_secret_key_64_bytes
   JWT_REFRESH_EXPIRES_IN=604800000ms
   ```

> ⚠️ **Lưu ý:** Hãy đảm bảo đã tạo Database (ví dụ: `english_app_db`) trong MySQL trước khi sang bước tiếp theo.

---

### 🗄️ Bước 4: Khởi tạo Cơ sở dữ liệu với Prisma ORM

Backend sử dụng **Prisma** làm ORM kết nối với MySQL. Để đồng bộ cấu trúc cơ sở dữ liệu và sinh Prisma Client:

> [!IMPORTANT]
> **LƯU Ý QUAN TRỌNG: BẮT BUỘC TỰ GENERATE PRISMA CLIENT CỤC BỘ (WINDOWS / MACOS / LINUX)**
> - Thư mục mã nguồn Prisma Client sinh ra (`src/generated/prisma`) **được cố tình loại bỏ khỏi Git** trong file `.gitignore`.
> - **Lý do:** Prisma Client sử dụng File nhị phân (Binary Query Engine) được biên dịch riêng cho từng Hệ điều hành (Windows `.dll.node`, macOS `darwin-arm64` / `darwin-x64`, Linux...). Việc push folder này lên Git sẽ gây crash app khi thành viên khác dùng OS khác kéo về.
> - **Mỗi thành viên khi clone project về máy (hoặc mỗi khi pull code có cập nhật schema.prisma)** BẮT BUỘC phải chạy lệnh `npx prisma generate` trên máy cá nhân để tự sinh ra folder `src/generated/prisma` tương thích hoàn toàn với Hệ điều hành của mình.

1. **Sinh Prisma Client (Bắt buộc cho từng máy/hệ điều hành)**:
   ```bash
   npx prisma generate
   ```

2. **Đồng bộ Schema vào Database (Development)**:
   ```bash
   npx prisma db push
   ```
   *(Hoặc nếu dự án sử dụng Migration: `npx prisma migrate dev`)*

---

### 🚀 Bước 5: Chạy dự án ở môi trường Development

Chạy lệnh sau để bắt đầu server backend ở chế độ xem thay đổi trực tiếp (Watch mode với `tsx`):
```bash
npm run dev
```

Sau khi chạy thành công, terminal sẽ hiển thị thông báo server đang lắng nghe tại cổng `PORT` (mặc định: `http://localhost:3000`).

---

### 🏗️ Bước 6: Build & Chạy ở môi trường Production (Tùy chọn)

Khi cần biên dịch TypeScript sang JavaScript và chạy bản Production:

1. Biên dịch TypeScript:
   ```bash
   npm run build
   ```

2. Chạy server từ thư mục biên dịch `dist`:
   ```bash
   npm run start
   ```

---

## 📁 3. Cấu Trúc Thư Mục Backend

```text
backend-api/
├── src/
│   ├── config/          # Đọc và validate cấu hình biến môi trường
│   ├── middleware/      # Middlewares (CORS, Rate limit, JWT Auth, Logging...)
│   ├── module/          # Các module xử lý nghiệp vụ theo tính năng
│   ├── prisma/          # File schema.prisma định nghĩa CSDL
│   ├── generated/       # Code Prisma Client sinh tự động (Đã .gitignore, mỗi máy tự generate)
│   ├── utils/           # Các hàm hỗ trợ dùng chung (helpers, formatting)
│   ├── app.ts           # Cấu hình ứng dụng Express
│   └── server.ts        # Entry point khởi chạy HTTP Server
├── docs_be/             # Tài liệu backend (API docs, setup guides...)
├── .env.example         # File môi trường mẫu
├── package.json         # Danh sách thư viện & scripts
└── tsconfig.json        # Cấu hình TypeScript compiler
```

---

## 📌 4. Một Số Lệnh Thường Dùng (Cheatsheet)

| Lệnh | Công dụng |
| :--- | :--- |
| `npm run dev` | Chạy backend ở chế độ phát triển (Auto reload khi sửa code) |
| `npm run build` | Biên dịch TypeScript sang JavaScript (`/dist`) |
| `npm run start` | Chạy ứng dụng đã được build |
| `npx prisma generate` | **Bắt buộc:** Sinh lại Prisma Client tương thích OS cá nhân |
| `npx prisma db push` | Đẩy thay đổi trong `schema.prisma` trực tiếp vào MySQL DB |
| `npx prisma studio` | Mở giao diện Web Prisma Studio để xem/sửa dữ liệu DB trực quan |

---

## ❓ Troubleshooting (Sửa Lỗi Thường Gặp)

1. **Lỗi `Cannot find module '@src/generated/prisma'` hoặc lỗi Prisma Engine (`query_engine-...`)**:
   - Do chưa chạy `npx prisma generate` hoặc folder `generated` thuộc OS khác.
   - **Cách xử lý:** Chạy `npx prisma generate` trong thư mục `backend-api`.
2. **Lỗi `Access denied for user ...`**:
   - Kiểm tra lại Username & Password của MySQL trong file `.env` tại biến `DATABASE_URL`.
3. **Lỗi `Unknown database '...'`**:
   - Mở MySQL Client/MySQL Workbench/phpMyAdmin và tạo một database rỗng với tên giống trong `DATABASE_URL`.
