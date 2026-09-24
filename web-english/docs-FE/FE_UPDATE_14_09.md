# 📅 DAILY LOG & FRONTEND DOCUMENTATION (14/09/2026)
**Branch:** deverlop
**Mô tả:** Tài liệu lưu trữ tiến độ công việc, tái cấu trúc (Refactor) Frontend và các giao diện mới được triển khai trong ngày.

---

## 🚀 1. TIẾN ĐỘ CÔNG VIỆC (CHANGELOG)

### ✨ Tính năng mới & Giao diện (UI/UX)
- **Dashboard Layout:** Đập đi xây lại giao diện trang Dashboard.tsx. Chuyển từ Sidebar dọc sang dạng **Thanh điều hướng ngang (Top Navbar)** theo phong cách Minimalist (Basic, không dùng icon/emoji rườm rà).
- **Thống kê:** Gọi 3 API song song (Total Students, Total Lessons, Total Words) và hiển thị lên giao diện dạng thẻ số liệu trực quan.
- **Cấu trúc Thư mục mới (Feature-based):** Tổ chức lại source code gọn gàng, chia theo từng chức năng (Features):
  - src/features/dashboard/
  - src/features/students/
  - src/features/words/

### ⚙️ Cấu hình (Core & Config)
- **Axios Interceptor (src/config/axios.ts):** Thiết lập file cấu hình Axios dùng chung, tự động móc thẻ dminToken từ localStorage và gắn vào Header Authorization cho mọi Request. (Giúp code gọi API ngắn gọn hơn 80%).
- **Cập nhật Route (App.tsx):** Đăng ký các Route hiển thị màn hình Dashboard và Quản lý Học viên.

### 🐛 Vá lỗi (Fix)
- **Lỗi tràn viền đen màn hình:** Xóa bỏ CSS giới hạn width: 1126px mặc định của Vite trong index.css, giúp Dashboard căng tràn 100% (Full screen).
- **Lỗi trắng màn hình (Undefined):** Sửa lỗi hiển thị tổng từ vựng do gọi sai field .total trong words.api.ts (API trả về thẳng giá trị số 9935 chứ không phải object).
- **Lỗi TypeScript import type:** Fix triệt để lỗi biên dịch TS do thiết lập erbatimModuleSyntax: true trong 	sconfig bằng cách bắt buộc dùng import type khi kéo Types/Interfaces.

---

## 🧩 2. TÀI LIỆU CẤU TRÚC (ARCHITECTURE DOCS)

### A. Luồng gọi API chuẩn của dự án (API Flow)
Khi code các tính năng mới, tuân thủ đúng 3 lớp sau để Frontend sạch và dễ bảo trì:
1. **Lớp Types (.types.ts):** Khai báo các Interface Typescript (Ví dụ: IStudent, IWord) để code có gợi ý.
2. **Lớp API Client (.api.ts):** Import xiosClient từ config/axios.ts và viết hàm gọi API (VD: getTotalStudents()). Xử lý trích xuất data (như eturn response.data.data) ngay tại đây.
3. **Lớp UI (.tsx):** Gọi hàm từ lớp API bên trong useEffect, lưu dữ liệu vào useState, và hiển thị ra HTML. Tuyệt đối không gọi Axios trực tiếp trong file UI.

### B. Mẹo xử lý Lỗi React phổ biến gặp hôm nay
> **"Objects are not valid as a React child"**
> - **Nguyên nhân:** Cố tình in một Object (như { total: 10 }) trực tiếp ra màn hình qua thẻ <p>{data}</p>.
> - **Cách fix:** React chỉ in được chuỗi (String) hoặc số (Number). Cần trỏ chính xác vào field con (data.total) trước khi ném vào State.
