# 📅 DAILY LOG & API DOCUMENTATION (14/09/2026)
**Branch:** deverlop
**Mô tả:** Tài liệu lưu trữ tiến độ công việc Backend trong ngày và chi tiết các API vừa khởi tạo/chỉnh sửa cho tính năng Dashboard (Thống kê Tổng Học viên, Tổng Bài học, Tổng Từ vựng) và Quản lý Từ vựng.

---

## 🚀 1. TIẾN ĐỘ CÔNG VIỆC (CHANGELOG)

### ✨ Tính năng mới (Feat)
- Tạo API GET /api/admin/students/totalStudent: Đếm tổng số học viên.
- Tạo API GET /api/admin/students/totalLesson: Đếm tổng số bài học.
- Tạo API GET /api/admin/word/totalWord: Đếm tổng số từ vựng.
- Tích hợp route wordRouter vào src/app.ts tại endpoint /api/admin/word.

### 🐛 Vá lỗi (Fix)
- **Routing:** Khắc phục lỗi 400 Bad Request ở module StudentManage bằng cách đẩy các route tĩnh (/totalStudent, /totalLesson, /totalWord) lên trên route động (/:id).
- **Prisma:** Cập nhật cách import Prisma trong word.repository.ts (Dùng instance chung ở config/prisma.ts thay vì 
ew PrismaClient() để tránh lỗi Uninitialized).
- **TypeScript:** Bypass lỗi Strict Type của Prisma trong ctivity-log.repository.ts khi truyền userId.

---

## 📚 2. TÀI LIỆU API (API DOCS)

> **⚠️ LƯU Ý BẢO MẬT (SECURITY)**
> - Toàn bộ API của StudentManage đã được bảo vệ bởi middleware Authenticate & uthorize(["admin"]).
> - **[VIỆC CẦN LÀM]** File word.route.ts hiện đang thiếu middleware phân quyền. Cần bổ sung outer.use(Authenticate, authorize(["admin"])); ở đầu file để tránh việc User thường gọi được API xóa từ vựng.

### 2.1. API THỐNG KÊ (DASHBOARD)

Tất cả các API thống kê đều yêu cầu **Admin Token** (Bearer <token>).

#### A. Tổng số Học viên
- **Endpoint:** GET /api/admin/students/totalStudent
- **Response (200 OK):**
  ``json
  {
    "success": true,
    "message": "Lấy số lượng học viên thành công",
    "data": { "total": 1254 }
  }
  ``

#### B. Tổng số Bài học
- **Endpoint:** GET /api/admin/students/totalLesson
- **Response (200 OK):**
  ``json
  {
    "success": true,
    "message": "Lấy tổng bài học",
    "data": { "total": 48 }
  }
  ``

#### C. Tổng số Từ vựng
- **Endpoint:** GET /api/admin/word/totalWord
- **Response (200 OK):**
  ``json
  {
    "success": true,
    "message": "lấy tổng từ vựng",
    "data": 9935
  }
  ``
  *(Lưu ý: API này trả về thẳng con số 9935 trong field data, không bọc trong object 	otal như 2 API trên)*.

---

### 2.2. API QUẢN LÝ TỪ VỰNG (/api/admin/word)

#### A. Lấy danh sách Từ vựng (Có phân trang)
- **Endpoint:** GET /api/admin/word
- **Query Params:**
  - page (number)
  - limit (number)
  - search (string, optional)
  - cefrLevel (string, optional)
- **Response (200 OK):** Trả về mảng items và pagination chứa thông tin phân trang.

#### B. Thêm Từ vựng mới
- **Endpoint:** POST /api/admin/word
- **Body:** JSON chứa các trường dữ liệu bắt buộc theo createWordSchema.
- **Response (201 Created):**
  ``json
  {
    "message": "Thêm từ vựng thành công",
    "data": { "id": "...", "headword": "..." }
  }
  ``

#### C. Sửa Từ vựng
- **Endpoint:** PUT /api/admin/word/:id
- **Body:** JSON chứa các trường cần update (updateWordSchema).
- **Response (200 OK):**
  ``json
  {
    "message": "Sửa từ vựng thành công",
    "data": { ... }
  }
  ``

#### D. Xóa Từ vựng
- **Endpoint:** DELETE /api/admin/word/:id
- **Response (200 OK):**
  ``json
  {
    "message": "Xóa từ vựng thành công"
  }
  ``
