# Tài liệu Kiến trúc & Triển khai Mobile App (EngMaster)

Tài liệu này cung cấp cái nhìn tổng quan về cấu trúc mã nguồn, công nghệ sử dụng và các luồng tính năng chính của ứng dụng Mobile, phục vụ cho việc phát triển tiếp nối và viết Báo cáo Khóa luận Tốt nghiệp.

## 1. Công nghệ sử dụng (Tech Stack)
* **Framework:** React Native & Expo (SDK 57)
* **Ngôn ngữ:** TypeScript
* **Navigation:** Expo Router (File-based routing tương tự Next.js)
* **Giao tiếp API:** Axios (Cấu hình Interceptor để đính kèm JWT Token)
* **Quản lý State & Storage:** `expo-secure-store` (Lưu trữ Token an toàn), React Hooks (`useState`, `useEffect`).
* **UI/UX:** `expo-linear-gradient`, `@expo/vector-icons` (Ionicons).
* **Native Modules:** `expo-audio` (Thu âm, xử lý giọng nói), `expo-auth-session` (Đăng nhập Google/Facebook).

---

## 2. Cấu trúc thư mục (Folder Structure)

Toàn bộ mã nguồn chính nằm trong thư mục `mobile-english/src/`:

```text
src/
├── api/
│   └── axiosClient.ts       # Cấu hình Axios, đính kèm Access Token vào Header
├── app/
│   ├── (auth)/              # Nhóm màn hình chưa đăng nhập
│   │   ├── login.tsx        # Màn hình Đăng nhập (Local & Social Login)
│   │   └── register.tsx     # Màn hình Đăng ký
│   ├── (tabs)/              # Nhóm màn hình chính (Bottom Tabs)
│   │   ├── _layout.tsx      # Cấu hình Tabs & Nút Bong bóng AI Chat (FAB)
│   │   ├── index.tsx        # Dashboard hiển thị tiến độ học tập
│   │   ├── explore.tsx      # Khám phá danh sách Khóa học / Bài học
│   │   ├── leaderboard.tsx  # Bảng xếp hạng
│   │   ├── community.tsx    # Cộng đồng
│   │   └── profile.tsx      # Màn hình thông tin cá nhân & Đăng xuất
│   ├── ai-chat.tsx          # Màn hình giao tiếp với Trợ lý AI (Gà)
│   ├── edit-profile.tsx     # Form cập nhật thông tin cá nhân
│   ├── settings.tsx         # Cài đặt ứng dụng
│   └── practice.tsx         # Màn hình luyện tập tổng hợp
├── components/
│   └── GopPractices.tsx     # Component Luyện phát âm (GOP)
├── constants/
│   └── api.ts               # Định nghĩa biến môi trường (Ví dụ: IP Backend)
└── service/
    └── gopNativeService.ts  # Logic kết nối API đánh giá phát âm
```

---

## 3. Các luồng tính năng trọng tâm (Core Features)

### 3.1. Luồng Xác thực người dùng (Authentication Flow)
1. **Đăng nhập truyền thống:** Người dùng nhập Email/Username và Mật khẩu. App gọi `POST /api/auth/login`.
2. **Social Login (Google/Facebook):** Sử dụng `expo-auth-session` để bật Webview của nền tảng tương ứng. Lấy được `idToken` (Google) hoặc `accessToken` (Facebook) rồi gửi về Backend để định danh.
3. **Lưu trữ Token:** Sau khi Backend xác thực thành công, App dùng `SecureStore.setItemAsync` để lưu Token vào vùng nhớ mã hóa của hệ điều hành di động.
4. **Điều hướng:** Đẩy người dùng vào màn hình chính: `router.replace('/(tabs)')`.

### 3.2. Trợ lý Ảo AI (Bong bóng Chat)
* **Giao diện (UI):** Tích hợp một nút nổi (Floating Action Button - FAB) màu tím tại `(tabs)/_layout.tsx`, giúp người dùng có thể gọi AI từ bất kỳ Tab nào.
* **Màn hình Chat (`ai-chat.tsx`):**
  * Thiết kế theo chuẩn tin nhắn (Bubble UI).
  * Gọi API `POST /api/ai/chat` qua `axiosClient`.
  * Có hiệu ứng Typing Indicator ("AI đang suy nghĩ...").
  * Tự động cuộn (`scrollToEnd`) khi có tin nhắn mới.
* **Logic Backend tương ứng:** AI được cấu hình bằng System Prompt để đóng vai gia sư tiếng Anh tên là **"Gà"**, kết nối trực tiếp với engine Ollama Local để xử lý ngôn ngữ tự nhiên.

### 3.3. Hệ thống bài học & Khám phá
* Trang `explore.tsx` gọi API `GET /api/student/courses` để lấy danh sách lộ trình.
* Hiển thị Card bài học chứa thông tin chi tiết: Tiêu đề, Mô tả, Chuẩn CEFR (A1, A2, B1...), và số lượng bài học tương ứng lấy từ Database.

### 3.4. Đánh giá Phát âm (Pronunciation Practice)
* Sử dụng module `expo-audio` để cấp quyền (`requestRecordingPermissionsAsync`) và ghi âm giọng nói của người học.
* Dữ liệu âm thanh được đóng gói và gửi qua `gopNativeService` đến hệ thống chấm điểm phát âm AI của Backend (Sử dụng WaveFile và các mô hình nhận diện âm vị).

---

## 4. Hướng dẫn thiết lập & Chạy dự án (Setup Guide)

### Bước 1: Cấu hình địa chỉ mạng
Do chạy trên môi trường Local, App Mobile cần biết địa chỉ IP của máy tính (Backend).
* Mở terminal trên máy tính, gõ `ipconfig` (Windows) để lấy địa chỉ IPv4 (VD: `192.168.0.100`).
* Mở file `src/constants/api.ts` và cập nhật:
  ```typescript
  export const API_URL = 'http://192.168.0.100:3000/api';
  ```

### Bước 2: Cài đặt thư viện
Tại thư mục `mobile-english`, chạy lệnh:
```bash
npm install
# Hoặc an toàn hơn khi thêm thư viện Native (như expo-audio, expo-auth-session):
npx expo install --fix
```

### Bước 3: Khởi chạy dự án
Chạy lệnh khởi động Expo Server:
```bash
npx expo start -c
```
*Ghi chú: Luôn dùng cờ `-c` (clear cache) nếu vừa đổi mạng IP, hoặc vừa cài thêm các thư viện có can thiệp sâu vào Native (như Camera, Audio).*

### Bước 4: Kiểm thử trên thiết bị thật
* Tải ứng dụng **Expo Go** trên App Store (iOS) hoặc Google Play (Android).
* Đảm bảo điện thoại và máy tính **bắt chung một mạng Wifi**.
* Dùng Camera (iOS) hoặc tính năng Scan trong Expo Go (Android) để quét mã QR hiện ra trên Terminal.
