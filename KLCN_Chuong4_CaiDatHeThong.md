# CHƯƠNG 4: CÀI ĐẶT HỆ THỐNG

Chương 4 trình bày chi tiết quá trình hiện thực hóa thiết kế của hệ thống học tiếng Anh đa nền tảng **EngMaster** từ bản thiết kế kiến trúc và cơ sở dữ liệu ở Chương 3 thành sản phẩm phần mềm hoàn chỉnh. Nội dung chương tập trung vào bốn phần trọng tâm: (1) Đặc tả môi trường phần cứng, phần mềm, cấu trúc mã nguồn và cấu hình kết nối giữa các phân hệ; (2) Cài đặt chi tiết các thuật toán lõi gồm thuật toán đánh giá thích ứng đa chiều **FAME-KT**, thuật toán chấm điểm phát âm chuẩn âm vị **GOP (Goodness of Pronunciation)** kết hợp căn chỉnh động **Needleman-Wunsch**, tích hợp mô hình nhận diện giọng nói **whisper.cpp** cùng mô hình ngôn ngữ lớn cục bộ **Ollama LLM**, thuật toán lặp lại ngắt quãng **SRS** và cơ chế phân quyền **RBAC**; (3) Kết quả cài đặt và đặc tả giao diện phân hệ Web Quản trị (**web-english**); và (4) Kết quả cài đặt và đặc tả giao diện phân hệ Ứng dụng Di động (**mobile-english**).


## 4.1. MÔI TRƯỜNG CÀI ĐẶT VÀ PHÁT TRIỂN HỆ THỐNG


### 4.1.1. Môi trường phần cứng và hệ điều hành

Do hệ thống **EngMaster** vận hành đồng thời máy chủ RESTful API, hệ quản trị cơ sở dữ liệu quan hệ MySQL và đặc biệt là các mô hình Trí tuệ nhân tạo cục bộ (**Ollama LLM** và **whisper.cpp / Xenova Whisper**), môi trường phần cứng cần đảm bảo năng lực tính toán đa luồng và dung lượng bộ nhớ RAM ổn định. Bảng 4.1 đặc tả chi tiết cấu hình phần cứng và hệ điều hành được sử dụng trong quá trình phát triển, huấn luyện và kiểm thử thực nghiệm hệ thống.


**Bảng 4.1: Đặc tả môi trường phần cứng và hệ điều hành triển khai hệ thống**

| Thành phần môi trường | Thông số cấu hình tối thiểu | Thông số cấu hình thực nghiệm / khuyến nghị | Vai trò trong hệ thống EngMaster |
| --- | --- | --- | --- |
| **Máy chủ Phát triển & Vận hành AI (Development & AI Host)** | CPU: 4 nhân (Intel Core i5 / Apple M1)<br>RAM: 8 GB<br>Ổ cứng: 256 GB SSD trống tối thiểu 20 GB<br>HĐH: Windows 10/11, macOS 13+, hoặc Ubuntu 22.04 LTS | CPU: Apple Silicon (M1/M2/M3) hoặc Intel Core i7 (8 nhân / 16 luồng)<br>RAM: 16 GB – 32 GB Unified/DDR4<br>Ổ cứng: 512 GB NVMe SSD<br>HĐH: macOS / Windows 11 64-bit | Vận hành đồng thời Backend Node.js (`backend-api`), MySQL 8.0, mô hình ngôn ngữ lớn cục bộ `Ollama` (`qwen2.5:0.5b` / `llama3.2`), bộ bóc băng âm thanh `whisper.cpp` (`ggml-base.en.bin`) và trình biên dịch Vite/Expo. |
| **Thiết bị Kiểm thử Nền tảng Web Quản trị (`web-english`)** | Độ phân giải màn hình: 1366 x 768 px (HD)<br>Trình duyệt: Google Chrome 120+, Microsoft Edge, Safari, hoặc Firefox | Độ phân giải màn hình: 1920 x 1080 px (Full HD) trở lên<br>Trình duyệt: Google Chrome 130+ (tích hợp React DevTools) | Thực thi giao diện Quản trị viên & Giảng viên, hiển thị biểu đồ thống kê Recharts, xử lý nhập liệu đề thi hàng loạt từ tệp Excel (`.xlsx`) và giám sát phiên chat AI. |
| **Thiết bị Kiểm thử Ứng dụng Di động (`mobile-english`)** | Android 10 (API 29) hoặc iOS 15.0 trở lên<br>RAM: 4 GB<br>Phần cứng: Tích hợp Microphone thu âm và Loa ngoài | Thiết bị thật iPhone (iOS 17+) / Điện thoại Android (Android 13+) kết nối cùng mạng Wi-Fi nội bộ (LAN) hoặc máy ảo iOS Simulator / Android Emulator | Thực thi ứng dụng Expo React Native, thu âm giọng nói tần số mẫu cao qua `expo-audio` phục vụ chấm điểm phát âm GOP/Whisper và lưu trữ bảo mật JWT qua `expo-secure-store`. |


### 4.1.2. Môi trường phần mềm, ngôn ngữ lập trình và thư viện công nghệ

Hệ thống **EngMaster** được xây dựng hoàn toàn bằng ngôn ngữ **TypeScript** xuyên suốt cả ba phân hệ (**Backend API**, **Web Admin**, **Mobile App**) nhằm đảm bảo tính an toàn kiểu dữ liệu tĩnh (Static Type Safety), hạn chế lỗi phát sinh lúc chạy (Runtime Errors) và đồng bộ hóa cấu trúc dữ liệu (DTO/Schema) giữa máy chủ và máy khách. Bảng 4.2, Bảng 4.3 và Bảng 4.4 đặc tả chi tiết các công nghệ và thư viện trọng tâm của từng phân hệ.


**Bảng 4.2: Đặc tả công nghệ và thư viện tại phân hệ Máy chủ (`backend-api`)**

| Nhóm chức năng | Tên công nghệ / Thư viện | Phiên bản | Mục đích sử dụng và đặc tả kỹ thuật |
| --- | --- | --- | --- |
| **Nền tảng thực thi & Ngôn ngữ** | Node.js & TypeScript (`tsx`, `tsc`) | Node 20+ / TS `^5.7.3` | Môi trường thực thi bất đồng bộ hướng sự kiện (Event-driven Non-blocking I/O) và trình biên dịch kiểm tra kiểu dữ liệu nghiêm ngặt. |
| **Khung làm việc Web (Web Framework)** | `express` | `^4.21.2` | Xây dựng hệ thống định tuyến RESTful API, quản lý chuỗi Middleware xác thực, phân quyền và xử lý lỗi tập trung. |
| **Hệ quản trị CSDL & ORM** | MySQL & `prisma` / `@prisma/client` | MySQL 8.0 / Prisma `^6.4.0` | Ánh xạ quan hệ – đối tượng (ORM) cho 22 bảng dữ liệu, quản lý lịch sử di trú lược đồ (`prisma migrate`) và truy vấn an toàn kiểu (Type-safe Queries). |
| **Xác thực & Bảo mật ứng dụng** | `jsonwebtoken`, `bcrypt`, `helmet`, `cors`, `express-rate-limit` | JWT `^9.0.3`, Bcrypt `^6.0.0`, Helmet `^8.0.0` | Băm mật khẩu bằng thuật toán Bcrypt, cấp phát Access/Refresh Token, bảo vệ HTTP Header bằng Helmet và giới hạn tần suất gọi API (1000 requests/phút). |
| **Kiểm tra dữ liệu & Tài liệu hóa API** | `zod`, `swagger-ui-express`, `swagger-autogen` | Zod `^3.24.2`, Swagger `^5.0.1` | Xác thực cấu trúc dữ liệu đầu vào (Request Body, Query, Params) và biến môi trường; tự động sinh tài liệu OpenAPI trực quan tại đường dẫn `/api-docs`. |
| **Trí tuệ nhân tạo & Xử lý ngôn ngữ** | `ollama`, `@google/generative-ai`, `compromise` | Ollama `^0.6.3` | Giao tiếp với máy chủ mô hình ngôn ngữ lớn cục bộ Ollama (mặc định model `qwen2.5:0.5b` hoặc `llama3.2`) để chấm bài Viết, bài Nói và vận hành chatbot Trợ giảng 'Gà'. |
| **Nhận diện giọng nói & Xử lý âm thanh** | `whisper.cpp` (`ggml-base.en.bin`), `@xenova/transformers`, `ffmpeg-static`, `wavefile` | Transformers `^2.17.2`, FFmpeg `^5.3.0`, Wavefile `^11.0.0` | Chuyển đổi mọi định dạng tệp thu âm từ thiết bị di động (`.m4a`, `.mp3`, `.caf`, `.wav`) về chuẩn PCM 16kHz 16-bit/32f Mono và trích xuất văn bản/âm vị phục vụ chấm điểm GOP. |
| **Xử lý tệp tin, Lịch trình & Kiểm thử** | `multer`, `xlsx`, `node-cron`, `pino`, `vitest`, `supertest` | Multer `^2.4.0`, XLSX `^0.18.5`, Vitest `^5.0.5` | Xử lý tải lên tệp đa phương tiện, đọc/ghi bảng tính Excel nhập đề thi hàng loạt, chạy tác vụ ngầm nhắc nhở học tập định kỳ và kiểm thử tự động. |


**Bảng 4.3: Đặc tả công nghệ và thư viện tại phân hệ Web Quản trị (`web-english`)**

| Nhóm chức năng | Tên công nghệ / Thư viện | Phiên bản | Mục đích sử dụng và đặc tả kỹ thuật |
| --- | --- | --- | --- |
| **Thư viện Giao diện & Công cụ đóng gói** | `react`, `react-dom`, `vite` | React `^19.2.8`, Vite `^8.2.0` | Xây dựng ứng dụng trang đơn (SPA - Single Page Application) với cơ chế tải lười (`React.lazy` & `Suspense`) giúp tối ưu tốc độ tải trang quản trị. |
| **Định tuyến & Truyền thông HTTP** | `react-router-dom`, `axios` | Router `^7.18.2`, Axios `^1.19.0` | Quản lý định tuyến các phân trang `/admin/*` và cấu hình Axios Interceptor tự động đính kèm Bearer Token cũng như xử lý làm mới phiên đăng nhập. |
| **Trực quan hóa dữ liệu & Biểu tượng** | `recharts`, `lucide-react` | Recharts `^3.10.1`, Lucide `^1.46.0` | Vẽ biểu đồ thống kê tăng trưởng học viên, phân bố trình độ CEFR, biểu đồ điểm số trên Dashboard và cung cấp hệ thống biểu tượng đồng nhất. |
| **Xử lý bảng tính & Xác thực OAuth** | `xlsx`, `@react-oauth/google`, `@greatsumini/react-facebook-login` | XLSX `^0.18.5` | Trích xuất và xuất dữ liệu từ vựng, câu hỏi kiểm tra, nhật ký hệ thống ra tệp Excel ngay trên trình duyệt của Quản trị viên. |


**Bảng 4.4: Đặc tả công nghệ và thư viện tại phân hệ Ứng dụng Di động (`mobile-english`)**

| Nhóm chức năng | Tên công nghệ / Thư viện | Phiên bản | Mục đích sử dụng và đặc tả kỹ thuật |
| --- | --- | --- | --- |
| **Khung phát triển Đa nền tảng** | `react-native`, `expo`, `expo-router` | RN `0.88.0`, Expo `^58.0.0` | Xây dựng ứng dụng di động gốc (Native iOS/Android) với cơ chế định tuyến dựa trên cấu trúc tệp tin (File-based Routing: `(auth)`, `(tabs)`, `course/[id]`, `lesson/[id]`). |
| **Xử lý Âm thanh & Giọng nói** | `expo-audio`, `expo-speech` | `~58.0.10`, `~58.0.3` | Thu âm giọng đọc của học viên qua Microphone thiết bị với độ trễ thấp để gửi về máy chủ chấm điểm GOP/Whisper; phát âm mẫu từ vựng ngoại tuyến bằng Text-to-Speech. |
| **Lưu trữ Bảo mật & Hệ thống tệp** | `expo-secure-store`, `expo-file-system`, `expo-image-picker` | `~58.0.2`, `~58.0.11` | Mã hóa và lưu trữ an toàn chuỗi `accessToken`, `refreshToken` trong Keychain (iOS) / Keystore (Android); chọn ảnh đại diện và ảnh bài đăng cộng đồng. |
| **Hiệu ứng Chuyển động & Giao diện** | `react-native-reanimated`, `react-native-gesture-handler`, `expo-linear-gradient` | Reanimated `4.7.1`, Gesture `~3.3.0` | Xử lý hoạt ảnh lật thẻ từ vựng Flashcard 60fps, hiệu ứng chuyển động trong 4 trò chơi giáo dục (Memory, Matching, Bubble, Mario) và bong bóng chat AI. |


### 4.1.3. Tổ chức cấu trúc mã nguồn của hệ thống

Mã nguồn của dự án được tổ chức theo mô hình **Multi-Project Repository** gồm 3 thư mục độc lập tương ứng với 3 phân hệ: `backend-api` (Máy chủ xử lý nghiệp vụ và AI), `web-english` (Ứng dụng Web Quản trị) và `mobile-english` (Ứng dụng Di động cho Học viên). Tại phân hệ `backend-api`, kiến trúc phân tầng theo mô-đun (**Modular Layered Architecture**: `route` -> `service` -> `repository` -> `schema`) được áp dụng nghiêm ngặt giúp tách biệt hoàn toàn tầng giao tiếp HTTP, tầng logic nghiệp vụ/thuật toán và tầng truy xuất dữ liệu Prisma.


*Cấu trúc thư mục tổng thể của dự án EngMaster (/Users/mac/English-App):*
```typescript
English-App/
├── backend-api/                        # PHÂN HỆ MÁY CHỦ RESTFUL API & LÕI AI
│   ├── bin/whisper/                    # Thực thi whisper-cli & model ggml-base.en.bin
│   ├── uploads/                        # Lưu trữ media, synonyms.csv, questionBank_full.json
│   └── src/
│       ├── config/                     # Cấu hình hệ thống (env.ts, prisma.ts, fame-kt.config.ts, swagger.ts)
│       ├── cron/                       # Tác vụ định kỳ (reminder.cron.ts nhắc nhở chuỗi ngày học)
│       ├── middleware/                 # Middleware (authenticate, authorize/permission, validate)
│       ├── module/                     # 26 Module nghiệp vụ độc lập (Controller/Route - Service - Repo)
│       │   ├── AI/                     # Chấm Viết/Nói Ollama, Whisper ASR & Thuật toán phát âm GOP
│       │   ├── onboarding/             # Thuật toán thích ứng FAME-KT (fame-kt.ts, onboarding.service.ts)
│       │   ├── auth/ & role/ & staff/  # Xác thực JWT, phiên thiết bị sessionId & phân quyền RBAC
│       │   ├── topic/ & course/ & word/# Quản trị Chủ đề, Bài học, Kho từ vựng (9.935+ từ)
│       │   ├── test/ & student-test/   # Ngân hàng đề kiểm tra 4 kỹ năng, Import Excel & Chấm điểm
│       │   ├── student-vocabulary/     # Thuật toán lặp lại ngắt quãng SRS & Sổ tay từ vựng
│       │   ├── game/ & bubble-game/ & memory-card/ & word-matching/ & mario-game/ # 4 Mini-Games
│       │   └── community/ & leaderboard/ & achievement/ & quest/ & notification/  # Tương tác & Gamification
│       ├── prisma/                     # Lược đồ CSDL (schema.prisma - 22 models), migrations & seed.ts
│       ├── shared/ & utils/            # Xử lý lỗi tập trung (ApiError), Logger (Pino), Hash SHA-256, JWT
│       ├── app.ts                      # Khởi tạo Express App, bảo mật Helmet, CORS, Rate Limit
│       └── server.ts                   # Điểm vào khởi chạy HTTP Server
├── web-english/                        # PHÂN HỆ WEB QUẢN TRỊ (REACT 19 + TYPESCRIPT + VITE)
│   └── src/
│       ├── components/layout/          # Khung giao diện AdminLayout.tsx & AdminNotificationDropdown
│       ├── config/axios.ts             # Cấu hình Axios Client & Interceptor cho Admin
│       ├── context/ToastContext.tsx    # Quản lý thông báo nổi (Toast Notification) toàn cục
│       ├── features/                   # 15 Phân hệ chức năng quản trị (auth, dashboard, students, words,
│       │                               # courses, topics, tests, keywords, ai-chat, game, achievements,
│       │                               # roles, staff, system-logs, settings)
│       └── App.tsx                     # Cấu hình định tuyến React Router v7 với Lazy Loading
└── mobile-english/                     # PHÂN HỆ ỨNG DỤNG DI ĐỘNG (REACT NATIVE + EXPO SDK 58)
    └── src/
        ├── api/axiosClient.ts          # Cấu hình kết nối API & tự động đính kèm Token từ SecureStore
        ├── app/                        # Hệ thống màn hình theo Expo Router
        │   ├── (auth)/                 # Màn hình Đăng nhập (login.tsx) & Đăng ký (register.tsx)
        │   ├── (tabs)/                 # 5 Tab chính: Trang chủ (index), Khám phá (explore),
        │   │                           # Bảng xếp hạng (leaderboard), Cộng đồng (community), Hồ sơ (profile)
        │   ├── onboarding.tsx          # Màn hình Khảo sát năng lực đầu vào thích ứng FAME-KT
        │   ├── course/[id].tsx         # Màn hình Chi tiết khóa học & danh sách bài học
        │   ├── lesson/[id].tsx         # Màn hình Học lý thuyết, Video, Flashcard & Làm bài kiểm tra
        │   ├── ai-chat.tsx             # Màn hình Trợ giảng AI "Gà", Chấm Viết & Chấm Nói
        │   └── game/                   # 4 Trò chơi: memory-card, word-matching, bubble-game, mario
        ├── components/                 # GopPractices.tsx, VocabReviewModal.tsx, DailyQuestModal.tsx...
        └── context/ThemeContext.tsx    # Quản lý giao diện Sáng / Tối (Light / Dark Mode)
```


### 4.1.4. Cài đặt và cấu hình kết nối các thành phần hệ thống

Để ba phân hệ vận hành đồng bộ và an toàn, quá trình cấu hình được chuẩn hóa thông qua bốn bước kỹ thuật gồm: (1) Kiểm tra biến môi trường bằng thư viện `Zod`; (2) Kết nối cơ sở dữ liệu MySQL qua `Prisma ORM`; (3) Khởi tạo đường ống Middleware bảo mật trên `Express`; và (4) Thiết lập bộ đánh chặn `Axios Interceptor` tại hai ứng dụng khách.

- **Bước 1: Cấu hình và kiểm tra biến môi trường nghiêm ngặt (`backend-api/src/config/env.ts`)**: Hệ thống sử dụng `Zod Schema` để ép kiểu và kiểm tra tính hợp lệ của toàn bộ các biến cấu hình trong tệp `.env` ngay khi khởi động máy chủ. Nếu thiếu chuỗi kết nối `DATABASE_URL` hoặc cấu hình sai định dạng cổng mạng, ứng dụng sẽ dừng khởi chạy và báo lỗi rõ ràng.

*Đoạn mã 4.1: Kiểm tra hợp lệ biến môi trường bằng Zod (backend-api/src/config/env.ts)*
```typescript
import "dotenv/config"; 
import z from "zod";

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    CORS_ORIGIN: z.string().url().default("http://localhost:8080"),
    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
    DATABASE_URL: z.string().url("DATABASE_URL không hợp lệ"),
    JWT_ACCESS_SECRET: z.string().default("access_secret_key_default_123456"),
    JWT_ACCESS_EXPIRES_IN: z.coerce.number().int().default(900000),      // 15 phút
    JWT_REFRESH_SECRET: z.string().default("refresh_secret_key_default_654321"),
    JWT_REFRESH_EXPIRES_IN: z.coerce.number().int().default(604800000),  // 7 ngày
    GOOGLE_AI_API_KEY: z.string().default(""),
    GOOGLE_CLIENT_ID: z.string().default(""), 
    FACEBOOK_APP_ID: z.string().default(""),
    FACEBOOK_APP_SECRET: z.string().default(""),
    AiModel: z.string().default("qwen2.5:0.5b")
});

export const env = envSchema.parse(process.env);
```

- **Bước 2: Cấu hình kết nối MySQL qua Prisma ORM và khởi tạo dữ liệu gốc (`backend-api/src/prisma/schema.prisma`)**: Hệ thống sử dụng `prisma-client-js` kết nối tới cơ sở dữ liệu MySQL thông qua chuỗi kết nối `mysql://root:password@localhost:3306/english_app`. Các lệnh `npm run migrate:dev` và `npm run seed` được thực thi để tự động ánh xạ 22 bảng dữ liệu, khởi tạo danh mục quyền hạn RBAC (`PermissionName`), nạp hơn 9.935 từ vựng chuẩn CEFR kèm phiên âm IPA và câu hỏi phân loại đầu vào.
- **Bước 3: Cấu hình máy chủ Express, bảo mật và định tuyến tập trung (`backend-api/src/app.ts`)**: Máy chủ được trang bị `helmet` (với chính sách `crossOriginResourcePolicy: 'cross-origin'` để cho phép tải tệp âm thanh/hình ảnh từ thư mục tĩnh `/uploads`), `cors` hỗ trợ đa nguồn gốc cho cả Web và Mobile App, `express-rate-limit` giới hạn 1.000 yêu cầu/phút chống tấn công vét cạn (Brute-force/DDoS), tích hợp tài liệu OpenAPI tại `/api-docs` và kích hoạt trình lập lịch `startCronJobs()` ngay khi khởi chạy.

## 4.2. CÀI ĐẶT CÁC THUẬT TOÁN TRỌNG TÂM TRONG HỆ THỐNG


### 4.2.1. Cài đặt thuật toán đánh giá thích ứng đa chiều FAME-KT và Hệ khuyến nghị lai

Thuật toán **FAME-KT (Fuzzy Adaptive Multi-dimensional Elo Knowledge Tracing)** là đóng góp khoa học trọng tâm của đề tài, được cài đặt tại hai tệp tin `backend-api/src/config/fame-kt.config.ts` và `backend-api/src/module/onboarding/fame-kt.ts`. Để đảm bảo tính linh hoạt và khả năng tinh chỉnh độc lập mà không cần can thiệp vào mã nguồn xử lý, toàn bộ các siêu tham số (Hyperparameters) của thuật toán được tách riêng vào đối tượng hằng số `FAME_KT_CONFIG` như mô tả trong Bảng 4.5.


**Bảng 4.5: Đặc tả các tham số cấu hình của thuật toán FAME-KT (`src/config/fame-kt.config.ts`)**

| Nhóm tham số | Tên hằng số cấu hình | Giá trị cài đặt | Ý nghĩa toán học và mục đích sư phạm |
| --- | --- | --- | --- |
| **1. Tâm lý học thời gian (`TIME_FACTOR`)** | `ANTI_BOT_THRESHOLD_SEC`<br>`ANTI_BOT_FACTOR`<br>`OPTIMAL_TIME_MIN_SEC`<br>`OPTIMAL_TIME_MAX_SEC`<br>`OPTIMAL_FACTOR`<br>`NORMAL_FACTOR`<br>`SLOW_MIN_FACTOR` | `5.6` giây<br>`0.2`<br>`5.6` giây<br>`37.3` giây<br>`1.5`<br>`1.0`<br>`0.3` | - Dưới `5.6s`: Nhận diện hành vi khoanh bừa / chống Bot, phạt giảm hệ số cập nhật còn `0.2`.<br>- Từ `5.6s` – `37.3s`: Vùng phản xạ tối ưu (Optimal Flow), thưởng hệ số `1.5`.<br>- Từ `37.3s` – `45s`: Làm bài bình thường, hệ số `1.0`.<br>- Trên `45s`: Phân vân hoặc tra cứu tài liệu bên ngoài, suy giảm hệ số về tối thiểu `0.3`. |
| **2. Lý thuyết phản ứng câu hỏi (`IRT`)** | `DEFAULT_GUESSING_PROBABILITY` (c) | `0.25` (25%) | Xác suất đoán đúng ngẫu nhiên của câu hỏi trắc nghiệm 4 lựa chọn (A, B, C, D). Giúp khử nhiễu điểm ảo khi học viên đoán trúng câu hỏi vượt tầm. |
| **3. Hệ số cập nhật Elo (`ELO`)** | `INITIAL_USER_ELO`<br>`DEFAULT_QUESTION_ELO`<br>`K_BASE` / `K_DIAGNOSTIC`<br>`K_QUESTION_BASE`<br>`MIN/MAX_QUESTION_ELO` | `950`<br>`1200`<br>`40` / `K = 75`<br>`6`<br>`[600, 2400]` | Khởi tạo học viên mới ở mốc `950` (tương đương A1). Sử dụng hệ số chẩn đoán nhanh `K_DIAGNOSTIC = 75` trong bài test đầu vào để hội tụ nhanh, đồng thời cập nhật ngược độ khó câu hỏi với hệ số giảm chấn `K = 6`. |
| **4. Dừng sớm thích ứng (`EARLY_STOP`)** | `MIN_QUESTIONS`<br>`RECENT_QUESTIONS_COUNT`<br>`VARIANCE_THRESHOLD` | `8` câu<br>`3` câu gần nhất<br>`10` điểm Elo | Sau tối thiểu `8` câu hỏi (đảm bảo mỗi kỹ năng trong 4 kỹ năng có ít nhất 2 câu), nếu biên độ dao động Elo trung bình trong `3` lần cập nhật gần nhất ≤ 10 và không nằm trong chuỗi tăng/giảm đơn điệu, bài kiểm tra tự động dừng sớm. |
| **5. Ngưỡng quy đổi khung chuẩn (`CEFR_THRESHOLDS`)** | `A1` / `A2` / `B1` / `B2` / `C1` / `C2` | `1000` / `1200` / `1400` / `1600` / `1800` / `2000` | Ánh xạ điểm Elo trung bình và từng kỹ năng của học viên sang 6 bậc năng lực của Khung tham chiếu ngôn ngữ chung Châu Âu (CEFR). |
| **6. Trọng số Hệ khuyến nghị lai (`RECOMMENDER`)** | `WEAKEST_SKILL_BONUS`<br>`CEFR_MATCH_BONUS`<br>`TOPIC_INTEREST_BONUS`<br>`SYNONYM_MATCH_BONUS`<br>`RECOMMENDED_COURSES_LIMIT` | `+20` điểm<br>`+15` điểm<br>`+10` điểm<br>`+5` điểm<br>`3` khóa học | Ưu tiên cao nhất (`+20` điểm) cho khóa học bổ trợ đúng kỹ năng yếu nhất (`Weakest Link`), kết hợp khớp trình độ CEFR (`+15`), khớp sở thích trực tiếp (`+10`) và khớp từ điển đồng nghĩa `synonyms.csv` (`+5`). |

Dựa trên bảng tham số cấu hình trên, tệp `backend-api/src/module/onboarding/fame-kt.ts` cài đặt 5 hàm toán học cốt lõi của thuật toán **FAME-KT**:

- **1. Hàm tính xác suất trả lời đúng kết hợp IRT 3PL (`getExpectedScoreIRT`)**: Thay vì sử dụng hàm Logistic chuẩn của hệ thống Elo truyền thống vốn giả định xác suất trả lời đúng tiến về 0 khi năng lực thấp, hàm `getExpectedScoreIRT` tích hợp tham số đoán mò c = 0.25 theo công thức: P(Correct) = c + (1 - c) × [1 / (1 + 10^((R_question - R_user) / 400))].
- **2. Hàm phân tích tâm lý học thời gian phản xạ (`calculateTimeFactor`)**: Chuyển đổi thời gian làm bài từ mili-giây (`timeTakenMs`) sang giây và đối chiếu với 4 phân vùng phản xạ để trả về hệ số điều chỉnh động α_time ∈ [0.2, 1.5].
- **3. Hàm cập nhật Elo đa chiều có tổn thất bất đối xứng (`updateAdvancedElo`)**: Bổ sung cơ chế **Asymmetric Loss** (thưởng thêm hệ số K theo tỷ lệ (R_question - R_user) / 1.5 khi học viên giải đúng câu hỏi khó hơn năng lực hiện tại, và giảm phạt còn 0.4 × K_base khi học viên làm sai câu hỏi quá khó có R_question > R_user + 150). Đồng thời, độ khó thực tế của câu hỏi trong cơ sở dữ liệu cũng được tự động hiệu chỉnh trực tuyến (Online Calibration) và kẹp biên an toàn trong đoạn [600, 2400].
- **4. Hàm kiểm tra hội tụ dừng sớm (`checkEarlyStop`)**: Xét biên độ dao động Δ = max(E_recent) - min(E_recent) trên cửa sổ trượt 3 câu gần nhất và kiểm tra tính đơn điệu (`isStrictlyIncreasing`, `isStrictlyDecreasing`) để quyết định kết thúc sớm bài kiểm tra đầu vào.
- **5. Hàm khuyến nghị lộ trình học tập cá nhân hóa (`recommendPersonalizedPath`)**: Duyệt qua vector năng lực 4 chiều (`Grammar`, `Vocabulary`, `Listening`, `Reading`) để tìm kỹ năng có điểm Elo thấp nhất (`weakestSkill`), sau đó chấm điểm toàn bộ các chủ đề khóa học dựa trên 4 tiêu chí trọng số và mở rộng từ khóa qua `keywordSettingService.resolveExpandedKeywords()`.

*Đoạn mã 4.2: Cài đặt lõi thuật toán FAME-KT và Hệ khuyến nghị lai (backend-api/src/module/onboarding/fame-kt.ts)*
```typescript
import { FAME_KT_CONFIG } from '../../config/fame-kt.config.js';

// 1. Hợp nhất IRT Guessing Factor (c = 0.25) và Elo
export function getExpectedScoreIRT(
  userElo: number, 
  questionElo: number, 
  c_guessing: number = FAME_KT_CONFIG.IRT.DEFAULT_GUESSING_PROBABILITY
): number {
  const probKnowledge = 1 / (1 + Math.pow(10, (questionElo - userElo) / 400));
  return c_guessing + (1 - c_guessing) * probKnowledge;
}

// 2. Phân tích tâm lý học thời gian phản xạ (Psychometrics Time Factor)
export function calculateTimeFactor(
  timeTakenMs: number, 
  expectedTimeMs: number = FAME_KT_CONFIG.TIME_FACTOR.EXPECTED_TIME_MS
): number {
  const timeTakenSec = timeTakenMs / 1000;
  const { 
    ANTI_BOT_THRESHOLD_SEC, ANTI_BOT_FACTOR, 
    OPTIMAL_TIME_MIN_SEC, OPTIMAL_TIME_MAX_SEC, OPTIMAL_FACTOR, 
    NORMAL_FACTOR, SLOW_MIN_FACTOR 
  } = FAME_KT_CONFIG.TIME_FACTOR;
  
  if (timeTakenSec < ANTI_BOT_THRESHOLD_SEC) return ANTI_BOT_FACTOR;
  if (timeTakenSec >= OPTIMAL_TIME_MIN_SEC && timeTakenSec <= OPTIMAL_TIME_MAX_SEC) return OPTIMAL_FACTOR;
  if (timeTakenSec > OPTIMAL_TIME_MAX_SEC && timeTakenSec <= expectedTimeMs / 1000) return NORMAL_FACTOR;
  return Math.max(SLOW_MIN_FACTOR, expectedTimeMs / timeTakenMs); 
}

// 3. Cập nhật đồng thời Elo Học viên & Elo Câu hỏi với Asymmetric Loss
export function updateAdvancedElo(
  userElo: number, questionElo: number, isCorrect: boolean, 
  timeTakenMs: number, c_guessing: number = FAME_KT_CONFIG.IRT.DEFAULT_GUESSING_PROBABILITY,
  kBaseCustom?: number
) {
  const actualScore = isCorrect ? 1 : 0;
  const expectedScore = getExpectedScoreIRT(userElo, questionElo, c_guessing);
  const timeFactor = calculateTimeFactor(timeTakenMs);
  
  let kBase = kBaseCustom || FAME_KT_CONFIG.ELO.K_BASE;
  if (isCorrect && questionElo > userElo) {
    kBase += (questionElo - userElo) / 1.5;
  } else if (!isCorrect && questionElo > userElo + 150) {
    kBase = Math.max(16, kBase * 0.4);
  }

  const kDynamic = kBase * timeFactor;
  const kQuestionBase = FAME_KT_CONFIG.ELO.K_QUESTION_BASE || 6;
  const rawQuestionElo = Math.round(questionElo + (kQuestionBase * timeFactor) * (expectedScore - actualScore));
  const clampedQuestionElo = Math.max(
    FAME_KT_CONFIG.ELO.MIN_QUESTION_ELO, 
    Math.min(FAME_KT_CONFIG.ELO.MAX_QUESTION_ELO, rawQuestionElo)
  );

  return {
    newUserElo: Math.round(userElo + kDynamic * (actualScore - expectedScore)),
    newQuestionElo: clampedQuestionElo
  };
}

// 4. Kiểm tra điều kiện dừng sớm thích ứng (CAT Early Stopping)
export function checkEarlyStop(
  eloHistory: number[], 
  minQuestions: number = FAME_KT_CONFIG.EARLY_STOP.MIN_QUESTIONS
): boolean {
  if (eloHistory.length < minQuestions) return false;
  const recentElos = eloHistory.slice(-FAME_KT_CONFIG.EARLY_STOP.RECENT_QUESTIONS_COUNT);
  const variance = Math.max(...recentElos) - Math.min(...recentElos);
  
  const isStrictlyIncreasing = recentElos.every((val, i, arr) => i === 0 || val > arr[i - 1]);
  const isStrictlyDecreasing = recentElos.every((val, i, arr) => i === 0 || val < arr[i - 1]);
  if ((isStrictlyIncreasing || isStrictlyDecreasing) && variance >= 6) return false;

  return variance <= FAME_KT_CONFIG.EARLY_STOP.VARIANCE_THRESHOLD;
}
```


### 4.2.2. Cài đặt thuật toán chấm điểm phát âm phân tầng GOP và Căn chỉnh động âm vị IPA

Để giải quyết điểm nghẽn lớn nhất của người học tiếng Anh tại Việt Nam là kỹ năng Nói và Phát âm (như đã khảo sát ở Chương 1), phân hệ `backend-api/src/module/AI/ai.service.ts` cài đặt thuật toán **Chấm điểm phát âm phân tầng chấp nhận biến thể giọng (Multi-level & Accent-Tolerant GOP Assessment)**. Thay vì chỉ so khớp chuỗi văn bản đơn thuần vốn quá khắt khe hoặc thiếu chi tiết đến từng âm vị, thuật toán được thiết kế gồm 4 giai đoạn xử lý chuyên sâu:

- **Giai đoạn 1 – Chuẩn hóa tín hiệu âm thanh và Nhận diện ASR (`audioBufferToFloat32Array` & `Xenova/whisper-tiny.en`)**: Tệp âm thanh thu từ điện thoại học viên được đưa qua `ffmpeg-static` và `WaveFile` để ép về chuẩn PCM 16.000 Hz, 1 kênh (Mono), giải mã thành mảng số thực `Float32Array` và đưa vào pipeline nhận diện âm học `Xenova/whisper-tiny.en` để trích xuất chuỗi văn bản thực tế học viên đã phát âm.
- **Giai đoạn 2 – Phân tách âm vị IPA và Chuyển đổi chữ viết sang âm vị (`splitIpaPhonemes` & `wordToIpaPhonemes`)**: Chuỗi phiên âm mục tiêu (`targetIpa`) và từ nhận diện được chuyển đổi thành mảng các âm vị IPA đơn và đôi (như `/oʊ/`, `/aɪ/`, `/tʃ/`, `/dʒ/`, `/θ/`, `/ð/`, `/ʃ/`...).
- **Giai đoạn 3 – Đo độ tương đồng ngữ âm sinh học và Căn chỉnh động Needleman-Wunsch (`computePhoneticSimilarity` & `alignPhonemeSequences`)**: Hệ thống xây dựng ma trận đặc trưng cấu âm `PHONETIC_MATRIX` biểu diễn từng âm vị IPA theo 6 chiều sinh học: Loại âm (`type`: nguyên âm đơn, nguyên âm đôi, phụ âm), Độ tròn môi (`rounded`), Thanh tính rung dây thanh quản (`voiced`), Vị trí cấu âm (`place`: từ môi = 1 đến thanh môn = 7), Phương thức cấu âm (`manner`: âm bật, âm xát, âm mũi, âm lỏng, âm lướt), Độ nâng lưỡi (`height`) và Độ lùi lưỡi (`backness`). Đồng thời, ma trận `ALLOPHONE_SETS` cho phép công nhận các biến thể phát âm tự nhiên giữa Anh – Anh và Anh – Mỹ (ví dụ âm Flap T `/ɾ/` trong *water, better* hoặc biến thể `/oʊ/` – `/əʊ/`) với độ tương đồng `0.92`. Trên cơ sở đó, thuật toán quy hoạch động **Needleman-Wunsch** với hệ số phạt khoảng trống `GAP_PENALTY = -0.25` thực hiện căn chỉnh tối ưu giữa chuỗi âm vị chuẩn E = (e_1, e_2, ..., e_n) và chuỗi âm vị thực tế S = (s_1, s_2, ..., s_m).
- **Giai đoạn 4 – Tổng hợp điểm GOP 3 tầng và Sinh phản hồi khẩu hình miệng sư phạm**: Điểm số cuối cùng (`overallScore` trên thang 100) được tổng hợp có trọng số từ 3 tầng: **55% Độ dễ hiểu toàn từ (Intelligibility Score)** + **30% Độ chính xác từng âm vị (Phoneme-level Accuracy)** + **15% Độ trôi chảy (Fluency & Prosody)**, đồng thời trừ điểm nếu vi phạm quy tắc âm câm (`SILENT_LETTER_RULES` như chữ *K* trong *Knight*, chữ *B* trong *Doubt*, chữ *P* trong *Psychology*). Đặc biệt, hệ thống tự động đối chiếu vector cấu âm giữa âm chuẩn và âm phát ra để sinh lời khuyên chỉnh khẩu hình miệng (ví dụ: *'Hãy chu tròn môi lại thay vì dẹt miệng'*, *'Chú ý bật nhẹ âm đuôi ở cuối từ'*).

*Đoạn mã 4.3: Ma trận ngữ âm sinh học và Thuật toán quy hoạch động Needleman-Wunsch (backend-api/src/module/AI/ai.service.ts)*
```typescript
// Đo độ tương đồng ngữ âm sinh học (Articulatory Phonetic Similarity)
function computePhoneticSimilarity(p1: string, p2: string): number {
  if (!p1 || !p2) return 0.0;
  if (p1 === p2) return 1.0;

  // Kiểm tra nhóm biến thể âm vị tự nhiên Anh - Mỹ (Allophone Sets)
  for (const set of ALLOPHONE_SETS) {
    if (set.includes(p1) && set.includes(p2)) return 0.92;
  }

  const v1 = PHONETIC_MATRIX[p1];
  const v2 = PHONETIC_MATRIX[p2];
  if (!v1 || !v2) return 0.25;
  if ((v1.type !== "consonant") !== (v2.type !== "consonant")) return 0.10;

  let matchScore = 0, totalWeights = 7;
  matchScore += (v1.voiced === v2.voiced) ? 1 : 0.5;                 // Thanh tính (Voicing)
  matchScore += Math.max(0, 3 - Math.abs(v1.place - v2.place));      // Vị trí cấu âm (Place)
  matchScore += Math.max(0, 3 - Math.abs(v1.manner - v2.manner));    // Phương thức cấu âm (Manner)

  if (v1.type !== "consonant" && v2.type !== "consonant") {
    totalWeights += 3;
    if (v1.rounded === v2.rounded) matchScore += 1;                  // Độ tròn môi (Roundedness)
    if (v1.height && v2.height) matchScore += Math.max(0, 1 - Math.abs(v1.height - v2.height) * 0.4);
    if (v1.backness && v2.backness) matchScore += Math.max(0, 1 - Math.abs(v1.backness - v2.backness) * 0.4);
  }
  return Math.min(1.0, Math.max(0.1, Math.pow(matchScore / totalWeights, 0.75)));
}

// Thuật toán quy hoạch động Needleman-Wunsch căn chỉnh 2 chuỗi âm vị IPA
function alignPhonemeSequences(expected: string[], spoken: string[]) {
  const n = expected.length, m = spoken.length, GAP_PENALTY = -0.25;
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = 0; i <= n; i++) dp[i][0] = i * GAP_PENALTY;
  for (let j = 0; j <= m; j++) dp[0][j] = j * GAP_PENALTY;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const sim = computePhoneticSimilarity(expected[i - 1], spoken[j - 1]);
      dp[i][j] = Math.max(
        dp[i - 1][j - 1] + sim,         // Khớp hoặc lệch âm vị (Match / Substitution)
        dp[i - 1][j] + GAP_PENALTY,     // Nuốt âm vị (Deletion / Omission)
        dp[i][j - 1] + GAP_PENALTY      // Thừa âm vị (Insertion)
      );
    }
  }
  // Truy vết ngược (Backtracking) từ dp[n][m] về dp[0][0] để lấy cặp ánh xạ từng âm vị...
}
```


### 4.2.3. Cài đặt tích hợp Nhận diện giọng nói whisper.cpp và Mô hình ngôn ngữ lớn cục bộ Ollama LLM

Bên cạnh việc đánh giá phát âm từng từ đơn lẻ, hệ thống cung cấp hai dịch vụ chấm điểm sản sinh ngôn ngữ cấp độ câu/đoạn văn gồm **Chấm bài Nói (`gradeSpeaking`)** và **Chấm bài Viết luận (`gradeEssay`)**, cùng dịch vụ **Trợ giảng hội thoại thông minh 'Gà' (`chatWithBot`)**:

- **1. Bóc băng âm thanh ngoại tuyến tốc độ cao bằng C++ (`transcribeAudioLocal`)**: Khi học viên nộp bài thu âm câu/đoạn văn, hệ thống chuẩn hóa luồng âm thanh về tệp WAV 16kHz 16-bit PCM tạm thời và gọi tiến trình thực thi nhị phân `whisper-cli` với mô hình `ggml-base.en.bin`. Đặc biệt, hệ thống áp dụng kỹ thuật **Context Prompting** truyền câu mẫu mục tiêu (`targetSentence`) vào tham số `--prompt` của `whisper.cpp`, giúp mô hình định hướng ngữ cảnh từ vựng chính xác hơn hẳn so với nhận diện mù.
- **2. Chấm điểm Nói, Viết và Hội thoại qua Ollama LLM kèm cơ chế Dự phòng an toàn (`safeParseAiJson` & `buildFallbackEssayEvaluation`)**: Văn bản bài viết hoặc bản bóc băng giọng nói được đóng gói vào câu lệnh nhắc (Prompt) có cấu trúc chặt chẽ và gửi tới máy chủ `ollama.chat({ model: env.AiModel, format: 'json' })` với giới hạn thời gian chờ (`Promise.race` timeout 15 giây). Để khắc phục hiện tượng mô hình ngôn ngữ lớn đôi khi sinh thêm ký tự Markdown (như ````json`) hoặc dấu phẩy thừa làm lỗi `JSON.parse`, hàm `safeParseAiJson` thực hiện lọc sạch chuỗi trước khi phân tích; nếu máy chủ Ollama quá tải, hàm dự phòng `buildFallbackEssayEvaluation` sẽ tự động kích hoạt để đảm bảo trải nghiệm học viên không bao giờ bị gián đoạn.

*Đoạn mã 4.4: Tích hợp whisper.cpp (Context Prompting) và Ollama LLM chấm điểm (backend-api/src/module/AI/ai.service.ts)*
```typescript
async transcribeAudioLocal(audioBuffer: Buffer, contextPrompt?: string): Promise<string> {
  const whisperBin = resolveWhisperBin();
  const whisperModel = resolveWhisperModel(); // bin/whisper/models/ggml-base.en.bin
  const normalizedBuffer = await convertAnyAudioToWavBuffer(audioBuffer);
  const tempFilePath = path.join(os.tmpdir(), `speech_${Date.now()}.wav`);
  await fs.promises.writeFile(tempFilePath, normalizedBuffer);

  try {
    const threadCount = Math.max(1, Math.min(4, os.cpus().length));
    const args = ["-m", whisperModel, "-f", tempFilePath, "-l", "en", "--no-timestamps", "-nt", "-t", threadCount.toString()];
    if (contextPrompt && contextPrompt.trim().length > 0) {
      args.push("--prompt", contextPrompt.trim()); // Kỹ thuật Context Prompting
    }
    const { stdout } = await execFileAsync(whisperBin, args, { windowsHide: true });
    return stdout.replace(/\[\d{2}:\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}\.\d{3}\]/g, "").replace(/\r?\n/g, " ").trim();
  } finally {
    await fs.promises.unlink(tempFilePath).catch(() => {});
  }
}
```


### 4.2.4. Cài đặt thuật toán Lặp lại ngắt quãng SRS và Cơ chế xác thực phân quyền RBAC

Để tối ưu hóa khả năng ghi nhớ từ vựng dài hạn và bảo vệ an toàn tuyệt đối cho các API của hệ thống, hai cơ chế thuật toán nghiệp vụ quan trọng sau đã được cài đặt:

- **1. Thuật toán Lặp lại ngắt quãng SRS (`submitReview` trong `student-vocabulary.service.ts`)**: Mỗi từ vựng của học viên trong bảng `user_progress` được quản lý qua 3 thuộc tính: trạng thái học (`status`: `new` -> `learning` -> `mastered`), cấp độ trí nhớ (`memoryLevel`) và ngày đến hạn ôn tập tiếp theo (`nextReviewDate`). Khi học viên ôn tập đúng (`isCorrect = true`), `memoryLevel` tăng thêm 1 bậc và khoảng cách ngày ôn tập kế tiếp được giãn rộng theo dãy cấp số nhân thực nghiệm `intervals = [1, 3, 7, 14, 30, 90]` ngày; khi đạt `memoryLevel >= 4`, từ vựng chính thức chuyển sang trạng thái `mastered` (Đã thuộc lòng). Ngược lại, nếu trả lời sai, `memoryLevel` giảm đi 1 bậc (`Math.max(0, memoryLevel - 1)`), trạng thái quay về `learning` và từ vựng được xếp lịch ôn lại ngay vào ngày hôm sau (`+1` ngày). Toàn bộ quá trình cập nhật tiến độ, cộng điểm thưởng XP (`+5 XP` khi đúng, `+1 XP` khích lệ khi sai) và ghi nhật ký hoạt động được đóng gói trong một giao dịch nguyên tử `prisma.$transaction`.
- **2. Cơ chế xác thực JWT đa phiên thiết bị và Kiểm soát truy cập dựa trên quyền hạn RBAC (`authenticate.middleware.ts` & `authorize.middleware.ts`)**: Khi người dùng gửi yêu cầu kèm `Bearer <accessToken>`, Middleware `Authenticate` giải mã chữ ký JWT, băm chuỗi token bằng thuật toán `SHA-256` (`hashSHA256(token)`) và đối chiếu với bảng `revoked_token` để chặn ngay lập tức các token đã đăng xuất. Tiếp đó, hệ thống truy vấn bảng `users` để kiểm tra cờ khóa tài khoản (`user.isLocked`) và nạp vai trò hiện hành. Tại tầng phân quyền, Middleware `requirePermission` đối chiếu danh sách hơn 100 quyền nguyên tử (`PermissionName` như `CREATE_WORD`, `CREATE_TEST_QUESTION_IMPORT`, `READ_AI_ADMIN_SESSIONS`...) gắn với vai trò của người dùng, đảm bảo phân tách chặt chẽ quyền hạn giữa Quản trị viên, Nhân viên vận hành và Học viên.

*Đoạn mã 4.5: Cài đặt thuật toán Lặp lại ngắt quãng SRS trong giao dịch nguyên tử (student-vocabulary.service.ts)*
```typescript
async submitReview(userId: number, wordId: number, isCorrect: boolean) {
  const progress = await prisma.userProgress.findUnique({
    where: { userId_wordId: { userId, wordId } }
  });
  if (!progress) throw new ApiError(404, "not_found", "Không tìm thấy tiến trình từ vựng này");

  let { memoryLevel } = progress;
  let status: LearningStatus = progress.status;
  let nextReviewDate = new Date();

  if (isCorrect) {
    memoryLevel += 1;
    // Chu kỳ lặp lại ngắt quãng SRS: 1 ngày, 3 ngày, 7 ngày, 14 ngày, 30 ngày, 90 ngày
    const intervals = [1, 3, 7, 14, 30, 90];
    const addDays = intervals[Math.min(memoryLevel - 1, intervals.length - 1)];
    nextReviewDate.setDate(nextReviewDate.getDate() + addDays);
    status = memoryLevel >= 4 ? LearningStatus.mastered : LearningStatus.learning;
  } else {
    memoryLevel = Math.max(0, memoryLevel - 1);
    nextReviewDate.setDate(nextReviewDate.getDate() + 1); // Ôn tập lại vào ngày hôm sau
    status = LearningStatus.learning;
  }

  const xpReward = isCorrect ? 5 : 1;
  const [updated] = await prisma.$transaction([
    prisma.userProgress.update({
      where: { id: progress.id },
      data: { memoryLevel, nextReviewDate, status }
    }),
    prisma.user.update({
      where: { id: userId },
      data: { xpPoints: { increment: xpReward } }
    }),
    prisma.activityLog.create({
      data: {
        userId,
        actionType: "STUDENT_REVIEW_VOCABULARY",
        description: `Học viên ôn tập từ vựng #${wordId} (${isCorrect ? 'Đúng' : 'Sai'}), +${xpReward} XP`
      }
    })
  ]);
  return { ...updated, xpAwarded: xpReward };
}
```


## 4.3. KẾT QUẢ CÀI ĐẶT VÀ ĐẶC TẢ GIAO DIỆN PHÂN HỆ WEB QUẢN TRỊ (WEB-ENGLISH)

Phân hệ Web Quản trị (**web-english**) được thiết kế theo phong cách hiện đại với bố cục thanh điều hướng bên trái (`AdminLayout.tsx`), thanh công cụ phía trên tích hợp chuông thông báo thời gian thực (`AdminNotificationDropdown.tsx`) và vùng làm việc trung tâm. Bảng 4.6 tổng hợp toàn bộ 18 tuyến đường dẫn (Routes), tệp mã nguồn giao diện và các điểm cuối API (Endpoints) tương ứng đã được cài đặt trên nền tảng Web.


**Bảng 4.6: Đặc tả tổng hợp các màn hình chức năng của phân hệ Web Quản trị (`web-english`)**

| STT | Tên màn hình chức năng | Đường dẫn Route | Tệp thành phần (`src/features/...`) | API Endpoint kết nối chính |
| --- | --- | --- | --- | --- |
| 1 | Đăng nhập Quản trị viên | `/admin/login` | `auth/pages/AdminLogin.tsx` | `POST /api/auth/login` |
| 2 | Bảng điều khiển Tổng quan | `/admin/dashboard` | `dashboard/pages/Dashboard.tsx` | `GET /api/admin/dashboard/stats` |
| 3 | Quản lý Chủ đề (Topics) | `/admin/topics` | `topics/pages/TopicList.tsx` | `GET/POST/PUT/DELETE /api/admin/topics` |
| 4 | Cấu hình Cấp độ Chủ đề | `/admin/topic-levels` | `topics/pages/TopicLevels.tsx` | `GET/PUT /api/admin/topic-settings` |
| 5 | Danh sách Bài học (Courses) | `/admin/courses` | `courses/pages/CourseList.tsx` | `GET/POST/PUT/DELETE /api/admin/courses` |
| 6 | Chi tiết Bài học (3 Tabs) | `/admin/courses/:courseId` | `courses/pages/CourseDetail.tsx` | `GET /api/admin/courses/:id`, `POST .../words` |
| 7 | Ngân hàng Từ vựng | `/admin/words` | `words/pages/WordList.tsx` | `GET/DELETE /api/admin/word`, `GET .../export` |
| 8 | Thêm mới / Nhập Từ vựng | `/admin/words/add` | `words/pages/AddWord.tsx` | `POST /api/admin/word`, `POST .../bulk` |
| 9 | Danh sách Đề kiểm tra | `/admin/tests` | `tests/pages/TestList.tsx` | `GET/POST/PUT/DELETE /api/admin/tests` |
| 10 | Chi tiết Đề thi & Import Excel | `/admin/tests/:testId` | `tests/pages/TestDetail.tsx` | `POST /api/admin/tests/:id/questions/import` |
| 11 | Thống kê Kết quả Kiểm tra | `/admin/tests/:testId/results` | `tests/pages/TestResults.tsx` | `GET /api/admin/tests/:id/results` |
| 12 | Quản lý Từ khóa AI (`synonyms.csv`) | `/admin/keywords` | `keywords/pages/KeywordSettings.tsx` | `GET/POST/PUT/DELETE /api/admin/keywords` |
| 13 | Giám sát Hội thoại Trợ giảng AI | `/admin/ai-chat` | `ai-chat/pages/AiChatList.tsx` | `GET /api/ai/admin/stats`, `GET .../sessions` |
| 14 | Quản lý Hồ sơ & Tiến độ Học viên | `/admin/students` | `students/pages/StudentList.tsx` | `GET /api/admin/students`, `PATCH .../status` |
| 15 | Quản lý Cấu hình Trò chơi | `/admin/game` | `game/pages/GameList.tsx` | `GET/PUT /api/games/settings` |
| 16 | Quản lý Danh hiệu (Achievements) | `/admin/achievements` | `achievements/pages/AchievementList.tsx` | `GET/POST/PUT/DELETE /api/admin/achievements` |
| 17 | Quản lý Nhân sự & Phân quyền RBAC | `/admin/staff`, `/admin/roles` | `staff/pages/StaffList.tsx`, `roles/pages/RoleList.tsx` | `GET/POST/PUT /api/admin/staff`, `/api/admin/roles` |
| 18 | Nhật ký Hệ thống & Cài đặt | `/admin/logs`, `/admin/settings` | `system-logs/pages/SystemLogs.tsx`, `settings/pages/Settings.tsx` | `GET /api/admin/logs`, `PATCH /api/auth/password` |


### 4.3.1. Giao diện Đăng nhập Quản trị và Trang Tổng quan (Dashboard)

Màn hình **Đăng nhập Quản trị (`AdminLogin.tsx`)** là cổng kiểm soát bảo mật đầu tiên dành cho Quản trị viên và Giảng viên. Giao diện kiểm tra định dạng email/tài khoản, gửi yêu cầu xác thực tới `POST /api/auth/login` và kiểm tra vai trò trả về phải thuộc nhóm quản trị (`admin` hoặc nhân sự được cấp quyền) trước khi lưu `accessToken` vào `localStorage` và điều hướng vào hệ thống.


> **[KHUNG CHỜ CHÈN ẢNH Hình 4.1]**  
> *Chụp màn hình trang Đăng nhập Web Admin (http://localhost:5173/admin/login) có form nhập Email/Username và Mật khẩu.*  
> **Hình 4.1: Giao diện màn hình Đăng nhập hệ thống Web Quản trị (/admin/login)**

Sau khi đăng nhập thành công, hệ thống chuyển tới **Trang Tổng quan (`Dashboard.tsx`)**. Màn hình này gọi đồng thời các API thống kê tại `/api/admin/dashboard/stats` để hiển thị các thẻ chỉ số thời gian thực (Tổng số học viên, Tổng số khóa học/bài học, Tổng số từ vựng trong kho, Tổng số bài kiểm tra đã hoàn thành), kèm theo biểu đồ trực quan hóa phân bố trình độ CEFR của học viên (từ A1 đến C2), danh sách các học viên xuất sắc nhất (Top XP) và chuông thông báo quản trị ở góc phải.


> **[KHUNG CHỜ CHÈN ẢNH Hình 4.2]**  
> *Chụp màn hình trang Dashboard hiển thị các thẻ thống kê tổng quan, biểu đồ Recharts và bảng xếp hạng học viên tích cực.*  
> **Hình 4.2: Giao diện màn hình Tổng quan hệ thống - Dashboard (/admin/dashboard)**


### 4.3.2. Giao diện Quản lý Chủ đề (Topics) và Cấu hình Cấp độ Chủ đề (Topic Settings)

Màn hình **Quản lý Chủ đề (`TopicList.tsx`)** cho phép Quản trị viên thiết lập các khóa học/chủ đề lớn (như *Business English, Information Technology, Travel & Tourism, Daily Communication...*) phân tầng theo 6 bậc năng lực CEFR (A1, A2, B1, B2, C1, C2). Quản trị viên có thể tìm kiếm chủ đề theo từ khóa, lọc theo cấp độ CEFR, thêm mới, cập nhật ảnh bìa hoặc xóa mềm (`deletedAt`) chủ đề.


> **[KHUNG CHỜ CHÈN ẢNH Hình 4.3]**  
> *Chụp màn hình trang Quản lý Chủ đề (/admin/topics) hiển thị danh sách các chủ đề kèm nhãn CEFR và modal thêm/sửa chủ đề.*  
> **Hình 4.3: Giao diện màn hình Quản lý danh sách Chủ đề khóa học (/admin/topics)**

Bên cạnh đó, màn hình **Cấu hình Cấp độ Chủ đề (`TopicLevels.tsx`)** kết nối với điểm cuối `/api/admin/topic-settings`, cho phép Quản trị viên thiết lập định mức số lượng chủ đề và quy tắc mở khóa lộ trình tương ứng với từng cấp độ năng lực CEFR của học viên.


> **[KHUNG CHỜ CHÈN ẢNH Hình 4.4]**  
> *Chụp màn hình trang Cấu hình Cấp độ Chủ đề (/admin/topic-levels) hiển thị thiết lập thông số cho các bậc A1 - C2.*  
> **Hình 4.4: Giao diện màn hình Cấu hình định mức Cấp độ Chủ đề theo CEFR (/admin/topic-levels)**


### 4.3.3. Giao diện Quản lý Bài học (Courses) và Chi tiết Bài học đa phân trang (Course Detail)

Màn hình **Quản lý Bài học (`CourseList.tsx`)** liệt kê toàn bộ các bài giảng thuộc từng chủ đề, hỗ trợ lọc theo trình độ CEFR, xem trạng thái hoạt động, khôi phục bài học đã ẩn (`UPDATE_COURSE_RESTORE`) và tạo mới bài học.


> **[KHUNG CHỜ CHÈN ẢNH Hình 4.5]**  
> *Chụp màn hình trang Quản lý Bài học (/admin/courses) hiển thị bảng danh sách bài giảng, bộ lọc CEFR và nút Thêm bài học.*  
> **Hình 4.5: Giao diện màn hình Quản lý danh sách Bài học (/admin/courses)**

Khi bấm vào một bài học cụ thể, hệ thống mở ra màn hình **Chi tiết Bài học (`CourseDetail.tsx` tại `/admin/courses/:courseId`)** được thiết kế tối ưu với 3 phân trang (Tabs) chuyên biệt: **Tab 1 (Thông tin chung & Lý thuyết)** cho phép biên soạn nội dung lý thuyết ngữ pháp/bài đọc định dạng Rich Text và nhúng đường dẫn Video bài giảng (`videoUrl`); **Tab 2 (Từ vựng bài học)** cho phép tra cứu từ kho từ điển chung hoặc tạo từ mới để gán vào bài học (`lesson_word`); và **Tab 3 (Bài tập / Đề kiểm tra)** hiển thị các đề kiểm tra đánh giá gắn liền với bài học đó.


> **[KHUNG CHỜ CHÈN ẢNH Hình 4.6]**  
> *Chụp màn hình trang Chi tiết Bài học (/admin/courses/:courseId) hiển thị rõ 3 Tab quản lý nội dung bài giảng, danh sách từ vựng gán vào bài và bài kiểm tra.*  
> **Hình 4.6: Giao diện màn hình Chi tiết Bài học với 3 phân trang Lý thuyết - Từ vựng - Bài tập (/admin/courses/:courseId)**


### 4.3.4. Giao diện Quản lý Ngân hàng Từ vựng (Word List & Add Word)

Phân hệ **Ngân hàng Từ vựng (`WordList.tsx` và `AddWord.tsx`)** quản lý kho từ điển hơn 9.935 từ vựng tiếng Anh của hệ thống. Giao diện hỗ trợ phân trang phía máy chủ, tìm kiếm tức thời theo từ gốc (`headword`), lọc theo từ loại (`partOfSpeech`: Noun, Verb, Adjective, Adverb...) và trình độ CEFR. Quản trị viên có thể thêm từng từ vựng mới kèm phiên âm chuẩn IPA (`phonetic`), tệp âm thanh phát âm mẫu (`audioUrl`), ảnh minh họa (`imageUrl`), nghĩa tiếng Việt và câu ví dụ, hoặc nhập hàng loạt (`CREATE_WORD_BULK`) và xuất toàn bộ kho từ vựng ra tệp Excel (`READ_WORD_EXPORT`).


> **[KHUNG CHỜ CHÈN ẢNH Hình 4.7]**  
> *Chụp màn hình trang Danh sách Từ vựng (/admin/words) hiển thị các cột: Từ vựng, Phiên âm IPA, Từ loại, Cấp độ CEFR, Nghĩa, Câu ví dụ và thanh tìm kiếm/xuất Excel.*  
> **Hình 4.7: Giao diện màn hình Quản lý Ngân hàng Từ vựng (/admin/words)**


> **[KHUNG CHỜ CHÈN ẢNH Hình 4.8]**  
> *Chụp màn hình biểu mẫu Thêm từ vựng mới (/admin/words/add) hoặc modal chỉnh sửa thông tin từ vựng kèm phiên âm IPA và câu ví dụ.*  
> **Hình 4.8: Giao diện màn hình Thêm mới và Chỉnh sửa Từ vựng (/admin/words/add)**


### 4.3.5. Giao diện Quản lý Đề kiểm tra, Ngân hàng Câu hỏi và Nhập liệu Excel hàng loạt

Tại màn hình **Danh sách Đề kiểm tra (`TestList.tsx`)** và **Chi tiết Đề kiểm tra (`TestDetail.tsx`)**, Quản trị viên thực hiện biên soạn các đề thi gắn với bài học hoặc đề khảo sát phân loại đầu vào (`lessonId = null`). Hệ thống hỗ trợ đầy đủ 5 định dạng câu hỏi (`multiple_choice`, `fill_in_blank`, `listening`, `speaking`, `writing`), cho phép cấu hình độ khó câu hỏi theo thang điểm Elo (`difficultyElo`), gắn nhãn kỹ năng (`Grammar`, `Vocabulary`, `Reading`, `Listening`) phục vụ thuật toán **FAME-KT** và tải lên tệp âm thanh MP3/hình ảnh.

Đặc biệt, tính năng **Nhập câu hỏi hàng loạt từ Excel (`CREATE_TEST_QUESTION_IMPORT`)** cho phép Giảng viên tải tệp `.xlsx` lên máy chủ; hệ thống sử dụng thư viện `xlsx` để bóc tách từng dòng dữ liệu, tự động kiểm tra tính hợp lệ và khởi tạo đồng loạt các bản ghi `Question` và `Answer` trong một giao dịch cơ sở dữ liệu.


> **[KHUNG CHỜ CHÈN ẢNH Hình 4.9]**  
> *Chụp màn hình trang Quản lý Bài kiểm tra (/admin/tests) hiển thị danh sách đề thi, số lượng câu hỏi, cấp độ CEFR và thống kê lượt làm bài.*  
> **Hình 4.9: Giao diện màn hình Quản lý danh sách Đề kiểm tra (/admin/tests)**


> **[KHUNG CHỜ CHÈN ẢNH Hình 4.10]**  
> *Chụp màn hình trang Chi tiết Đề kiểm tra (/admin/tests/:testId) hiển thị danh sách câu hỏi, thông số Difficulty Elo, Skill Category và nút Import Excel.*  
> **Hình 4.10: Giao diện màn hình Chi tiết Đề kiểm tra, Biên soạn Câu hỏi và Nhập từ file Excel (/admin/tests/:testId)**


### 4.3.6. Giao diện Quản lý Từ khóa đồng nghĩa AI và Giám sát Hội thoại Trợ giảng AI

Để huấn luyện và làm giàu tri thức cho Hệ khuyến nghị lai trong thuật toán **FAME-KT**, màn hình **Quản lý Từ khóa (`KeywordSettings.tsx` tại `/admin/keywords`)** cho phép Quản trị viên trực tiếp thêm, sửa, xóa và tải xuống tệp từ điển đồng nghĩa `synonyms.csv`. Khi Quản trị viên bổ sung các từ khóa song ngữ Anh – Việt vào một nhóm chủ đề (ví dụ nhóm *Công nghệ (IT)* gồm *technology, software, coding, ai, lập trình, phần mềm...*), thuật toán khuyến nghị sẽ lập tức nhận diện được mối liên hệ ngữ nghĩa giữa sở thích/nghề nghiệp tự do của học viên và các khóa học trong hệ thống.


> **[KHUNG CHỜ CHÈN ẢNH Hình 4.11]**  
> *Chụp màn hình trang Quản lý Từ khóa (/admin/keywords) hiển thị các nhóm chủ đề và danh sách từ khóa đồng nghĩa trong synonyms.csv.*  
> **Hình 4.11: Giao diện màn hình Quản lý Từ điển đồng nghĩa phục vụ AI Recommender (/admin/keywords)**

Song song đó, màn hình **Giám sát Hội thoại AI (`AiChatList.tsx` tại `/admin/ai-chat`)** cung cấp bảng điều khiển theo dõi hoạt động của Trợ giảng ảo 'Gà' với 4 chỉ số tổng hợp (`totalSessions`, `totalMessages`, `activeUsers`, `avgMessagesPerSession`) và cho phép Quản trị viên xem lại chi tiết nội dung từng phiên hỏi đáp giữa học viên và mô hình `Ollama LLM` để kiểm soát chất lượng sư phạm.


> **[KHUNG CHỜ CHÈN ẢNH Hình 4.12]**  
> *Chụp màn hình trang Quản lý AI Chat (/admin/ai-chat) hiển thị các thẻ thống kê phiên chat và cửa sổ xem chi tiết lịch sử tin nhắn giữa Học viên và AI.*  
> **Hình 4.12: Giao diện màn hình Thống kê và Giám sát lịch sử Hội thoại Trợ giảng AI (/admin/ai-chat)**


### 4.3.7. Giao diện Quản lý Học viên, Theo dõi Tiến độ Elo 4 kỹ năng và Gửi Thông báo

Màn hình **Quản lý Học viên (`StudentList.tsx` tại `/admin/students`)** cung cấp công cụ toàn diện để Bộ phận Giám sát đào tạo theo dõi từng người học. Quản trị viên có thể xem danh sách học viên, lọc theo trình độ CEFR, khóa hoặc mở khóa tài khoản vi phạm (`PATCH /api/admin/students/:id/status`), và bấm vào từng học viên để xem hồ sơ năng lực chi tiết gồm: chỉ số Elo 4 kỹ năng (`grammarElo`, `vocabElo`, `readingElo`, `listeningElo`), tổng điểm kinh nghiệm `xpPoints`, tiến độ thuộc từ vựng SRS (`new`, `learning`, `mastered`) và lịch sử làm bài kiểm tra.

Ngoài ra, Quản trị viên có thể chọn một học viên hoặc toàn bộ danh sách để soạn thảo và gửi **Thông báo đẩy (`POST /api/admin/notifications`)** trực tiếp tới ứng dụng di động nhằm nhắc nhở lịch học hoặc thông báo khóa học mới.


> **[KHUNG CHỜ CHÈN ẢNH Hình 4.13]**  
> *Chụp màn hình trang Quản lý Học viên (/admin/students) hiển thị bảng thông tin học viên, trình độ CEFR, điểm XP, trạng thái hoạt động và các nút thao tác.*  
> **Hình 4.13: Giao diện màn hình Quản lý danh sách Học viên và Trạng thái tài khoản (/admin/students)**


> **[KHUNG CHỜ CHÈN ẢNH Hình 4.14]**  
> *Chụp màn hình cửa sổ xem chi tiết tiến độ học tập của 1 học viên hoặc modal Gửi thông báo từ Admin tới Mobile App.*  
> **Hình 4.14: Giao diện Modal Xem chi tiết Tiến độ học tập (Elo 4 kỹ năng) và Gửi Thông báo cho Học viên**


### 4.3.8. Giao diện Quản lý Trò chơi, Danh hiệu, Phân quyền RBAC và Nhật ký hệ thống

Để hoàn thiện hệ sinh thái quản trị, phân hệ Web cung cấp đầy đủ các màn hình cấu hình động cho cơ chế Gamification và bảo mật hệ thống:

- **Màn hình Quản lý Trò chơi (`GameList.tsx` tại `/admin/game`) và Danh hiệu (`AchievementList.tsx` tại `/admin/achievements`)**: Cho phép Quản trị viên bật/tắt trạng thái hoạt động (`isActive`) của 4 mini-game (`MEMORY`, `MATCHING`, `BUBBLE`, `MARIO`), tùy chỉnh thông số từng mức độ khó (`EASY`, `NORMAL`, `HARD`) gồm số lượng cặp từ (`itemCount`), điểm thưởng mỗi câu (`pointsPerItem`), điểm phạt (`penaltyPoints`), giới hạn thời gian (`timeLimit`), cũng như thiết lập điều kiện điểm XP (`requireXp`) và chuỗi ngày học (`requireStreak`) để mở khóa huy hiệu thành tích.
- **Màn hình Quản lý Nhân sự (`StaffList.tsx`), Phân quyền Vai trò (`RoleList.tsx`) và Nhật ký hệ thống (`SystemLogs.tsx`)**: Cho phép khởi tạo các vai trò mới, gán/gỡ từng quyền hạn chi tiết trong ma trận `PermissionName` cho nhân viên quản trị, đồng thời giám sát và xuất báo cáo Excel toàn bộ nhật ký hoạt động (`activity_logs`) và lịch sử đăng nhập (`login_logs` kèm địa chỉ IP, thông tin thiết bị).

> **[KHUNG CHỜ CHÈN ẢNH Hình 4.15]**  
> *Chụp màn hình trang Quản lý Trò chơi (/admin/game) hiển thị cấu hình độ khó Easy/Normal/Hard hoặc trang Quản lý Danh hiệu (/admin/achievements).*  
> **Hình 4.15: Giao diện màn hình Quản lý Cấu hình Trò chơi (/admin/game) và Danh hiệu (/admin/achievements)**


> **[KHUNG CHỜ CHÈN ẢNH Hình 4.16]**  
> *Chụp màn hình trang Quản lý Vai trò & Phân quyền (/admin/roles) hiển thị ma trận các quyền hạn (Permissions) được cấp cho từng Role.*  
> **Hình 4.16: Giao diện màn hình Quản lý Nhân sự (/admin/staff) và Phân quyền Vai trò RBAC (/admin/roles)**


> **[KHUNG CHỜ CHÈN ẢNH Hình 4.17]**  
> *Chụp màn hình trang Nhật ký hệ thống (/admin/logs) ghi vết chi tiết các thao tác của người dùng và quản trị viên theo thời gian thực.*  
> **Hình 4.17: Giao diện màn hình Nhật ký Hoạt động Hệ thống (/admin/logs) và Cài đặt Tài khoản (/admin/settings)**


## 4.4. KẾT QUẢ CÀI ĐẶT VÀ ĐẶC TẢ GIAO DIỆN PHÂN HỆ ỨNG DỤNG DI ĐỘNG (MOBILE-ENGLISH)

Phân hệ Ứng dụng Di động (**mobile-english**) được xây dựng trên nền tảng **React Native 0.88** và **Expo SDK 58**, hỗ trợ chuyển đổi linh hoạt giữa giao diện Sáng/Tối (`ThemeContext.tsx`) và tối ưu hóa cho thao tác chạm vuốt một tay trên màn hình điện thoại thông minh. Bảng 4.7 tổng hợp danh mục 19 màn hình và thành phần giao diện chính trên ứng dụng di động cùng các điểm cuối API kết nối tương ứng.


**Bảng 4.7: Đặc tả tổng hợp các màn hình chức năng của phân hệ Ứng dụng Di động (`mobile-english`)**

| STT | Tên màn hình / Thành phần Mobile | Tệp mã nguồn (`src/app/...` & `components/...`) | API Endpoint kết nối chính | Mô tả chức năng nghiệp vụ trọng tâm |
| --- | --- | --- | --- | --- |
| 1 | Đăng nhập & Đăng ký tài khoản | `(auth)/login.tsx`, `(auth)/register.tsx` | `POST /api/auth/login`, `/register`, `/google`, `/facebook` | Xác thực tài khoản cục bộ hoặc OAuth2, lưu JWT vào `expo-secure-store` và kiểm tra cờ `onboardingCompleted`. |
| 2 | Khảo sát đầu vào thích ứng FAME-KT | `onboarding.tsx` | `GET /api/onboarding/options`, `/questions`, `POST /check-progress`, `/submit` | Thu thập nghề nghiệp/sở thích, làm bài test thích ứng đo thời gian `timeTakenMs`, dừng sớm CAT và hiển thị biểu đồ Radar 4 kỹ năng. |
| 3 | Trang chủ & Lộ trình cá nhân hóa | `(tabs)/index.tsx`, `DailyQuestModal.tsx` | `GET /api/student/courses`, `/api/student/quests` | Hiển thị chuỗi ngày học (Streak), điểm XP, nhiệm vụ hàng ngày, từ vựng đến hạn ôn tập và các khóa học gợi ý theo điểm yếu. |
| 4 | Khám phá Khóa học & Chi tiết Khóa học | `(tabs)/explore.tsx`, `course/[id].tsx` | `GET /api/student/courses`, `/api/student/courses/:id/lessons` | Tìm kiếm, lọc khóa học theo 6 bậc CEFR (A1–C2), xem tiến độ hoàn thành từng bài giảng trong chủ đề. |
| 5 | Học Bài giảng, Flashcard & Làm Bài tập | `lesson/[id].tsx` | `GET /api/student/lessons/:id`, `POST /api/student/tests/:id/submit` | Xem Video bài giảng, đọc lý thuyết, lật thẻ từ vựng Flashcard, thu âm luyện phát âm và làm bài kiểm tra 5 định dạng câu hỏi. |
| 6 | Ôn tập Lặp lại ngắt quãng SRS & Sổ tay từ | `VocabReviewModal.tsx`, `saved-words.tsx` | `GET /api/student/vocabulary/due`, `POST .../review`, `GET /api/student/vocabulary` | Ôn tập các từ vựng đến hạn theo chu kỳ SRS `[1, 3, 7, 14, 30, 90]` ngày và quản lý danh sách từ vựng đã lưu. |
| 7 | Luyện phát âm chuẩn âm vị IPA (GOP) | `components/GopPractices.tsx`, `practice.tsx` | `POST /api/ai/evaluate-pronunciation` | Thu âm giọng đọc qua `expo-audio`, hiển thị điểm GOP tổng quát, bóc tách màu sắc từng âm vị IPA (Đúng/Sai) và hướng dẫn khẩu hình miệng. |
| 8 | Trợ giảng AI 'Gà' & Chấm Nói / Viết | `ai-chat.tsx` | `POST /api/ai/chat`, `/grade-essay`, `/grade-speaking` | Trò chuyện đa phiên với AI 'Gà', nộp bài viết luận hoặc bài ghi âm nói tự do để nhận điểm CEFR và sửa lỗi chi tiết. |
| 9 | Khu trò chơi giáo dục (4 Mini-Games) | `games.tsx`, `game/memory-card.tsx`, `word-matching.tsx`, `bubble-game.tsx`, `mario.tsx` | `GET/POST /api/game/memory-card`, `/word-matching`, `/bubble-game`, `/mario` | Rèn luyện phản xạ từ vựng qua 4 trò chơi tương tác có tính giờ, tính điểm thưởng XP và lưu lịch sử đấu. |
| 10 | Bảng xếp hạng, Cộng đồng & Hồ sơ cá nhân | `(tabs)/leaderboard.tsx`, `community.tsx`, `profile.tsx`, `achievements.tsx`, `history.tsx` | `GET /api/student/leaderboard`, `/community/posts`, `/api/profile` | Đua top XP toàn hệ thống, đăng bài chia sẻ kinh nghiệm học tập, xem huy hiệu thành tích, chứng chỉ và lịch sử kiểm tra. |


### 4.4.1. Giao diện Đăng ký, Đăng nhập và Khảo sát năng lực đầu vào thích ứng (Onboarding FAME-KT)

Khi người học mở ứng dụng lần đầu, màn hình **Đăng nhập (`(auth)/login.tsx`)** và **Đăng ký (`(auth)/register.tsx`)** cho phép khởi tạo tài khoản mới hoặc đăng nhập nhanh qua Google/Facebook. Ngay sau khi xác thực thành công, ứng dụng kiểm tra thuộc tính `user.onboardingCompleted`; nếu mang giá trị `false`, hệ thống tự động chuyển hướng người học sang màn hình **Khảo sát năng lực đầu vào (`onboarding.tsx`)**.


> **[KHUNG CHỜ CHÈN ẢNH Hình 4.18]**  
> *Ghép 2 ảnh chụp màn hình điện thoại: Màn hình Đăng nhập (Login) và Màn hình Đăng ký (Register) trên Mobile App.*  
> **Hình 4.18: Giao diện màn hình Đăng nhập và Đăng ký tài khoản trên Ứng dụng Di động ((auth)/login.tsx & register.tsx)**

Màn hình **Onboarding cá nhân hóa (`onboarding.tsx`)** được thiết kế gồm 3 bước tuần tự rõ ràng:

- **Bước 1 (Thu thập hồ sơ cá nhân)**: Học viên chọn Nghề nghiệp hiện tại (*Học sinh / Sinh viên, Người đi làm, Giáo viên...*) và chạm chọn các thẻ Sở thích cá nhân (*Công nghệ IT, Du lịch, Kinh doanh, Giao tiếp hàng ngày, Giải trí / Game...*) được tải động từ tệp `synonyms.csv` trên máy chủ.
- **Bước 2 (Làm bài kiểm tra thích ứng FAME-KT có đo thời gian phản xạ)**: Học viên thực hiện trả lời các câu hỏi phân loại đầu vào trải đều trên 4 kỹ năng (`Grammar`, `Vocabulary`, `Reading`, `Listening`), có tích hợp phát âm thanh cho câu hỏi Nghe (`expo-speech` / `expo-audio`). Ở mỗi câu hỏi, bộ đếm thời gian ngầm ghi nhận chính xác số mili-giây suy nghĩ (`timeTakenMs`) từ lúc hiển thị đề đến lúc bấm chọn đáp án và gửi tới `/api/onboarding/check-progress`. Khi thuật toán **FAME-KT** phát hiện điểm Elo đã hội tụ (`stoppedEarly = true`), ứng dụng tự động thông báo kết thúc sớm bài kiểm tra để tiết kiệm thời gian cho học viên.
- **Bước 3 (Trực quan hóa Hồ sơ năng lực 4 chiều & Đề xuất Lộ trình độc bản)**: Màn hình kết quả hiển thị huy hiệu trình độ CEFR đạt được (A1–C2), bảng điểm Elo chi tiết của từng kỹ năng (chỉ rõ kỹ năng yếu nhất cần ưu tiên cải thiện) và danh sách 3 khóa học được Hệ khuyến nghị lai đề xuất riêng cho học viên.

> **[KHUNG CHỜ CHÈN ẢNH Hình 4.19]**  
> *Ghép 2 ảnh chụp màn hình điện thoại: Màn hình chọn Nghề nghiệp/Sở thích và Màn hình làm câu hỏi trắc nghiệm đầu vào.*  
> **Hình 4.19: Giao diện Bước 1 (Chọn Nghề nghiệp & Sở thích) và Bước 2 (Làm bài kiểm tra thích ứng FAME-KT) trên Mobile (onboarding.tsx)**


> **[KHUNG CHỜ CHÈN ẢNH Hình 4.20]**  
> *Chụp màn hình kết quả Onboarding hiển thị trình độ CEFR, điểm Elo 4 kỹ năng (Grammar, Vocab, Reading, Listening) và danh sách khóa học gợi ý.*  
> **Hình 4.20: Giao diện Bước 3: Kết quả đánh giá CEFR, Hồ sơ Elo 4 kỹ năng và 3 Khóa học đề xuất cá nhân hóa (onboarding.tsx)**


### 4.4.2. Giao diện Trang chủ (Home), Lộ trình cá nhân hóa, Nhiệm vụ ngày và Khám phá (Explore)

Sau khi hoàn tất khảo sát đầu vào, học viên được đưa tới **Trang chủ (`(tabs)/index.tsx`)**. Giao diện Trang chủ hiển thị lời chào cá nhân hóa, thanh trạng thái năng lượng gồm Chuỗi ngày học liên tiếp (`Streak`), tổng điểm kinh nghiệm (`XP`), nút mở cửa sổ **Nhiệm vụ hàng ngày (`DailyQuestModal.tsx`)** và thẻ nhắc nhở số lượng từ vựng đã đến hạn cần ôn tập theo thuật toán SRS.

Đặc biệt, khu vực **Lộ trình gợi ý cho bạn** trên Trang chủ ưu tiên hiển thị các khóa học khớp với trường `preferredTopics` và kỹ năng yếu nhất của học viên. Khi chuyển sang tab **Khám phá (`(tabs)/explore.tsx`)**, học viên có thể tìm kiếm toàn bộ các chủ đề khóa học trong hệ thống, lọc theo từng bậc năng lực CEFR (từ A1 đến C2) và bấm vào một khóa học để xem danh sách các bài giảng thành phần (`course/[id].tsx`).


> **[KHUNG CHỜ CHÈN ẢNH Hình 4.21]**  
> *Ghép 2 ảnh chụp màn hình điện thoại: Màn hình Trang chủ ((tabs)/index.tsx) và Modal Nhiệm vụ hàng ngày (DailyQuestModal.tsx).*  
> **Hình 4.21: Giao diện màn hình Trang chủ (Home) hiển thị Lộ trình cá nhân hóa và Cửa sổ Nhiệm vụ hàng ngày (Daily Quests)**


> **[KHUNG CHỜ CHÈN ẢNH Hình 4.22]**  
> *Ghép 2 ảnh chụp màn hình điện thoại: Màn hình Khám phá (Explore) lọc theo A1-C2 và Màn hình danh sách bài học trong khóa (course/[id].tsx).*  
> **Hình 4.22: Giao diện màn hình Khám phá khóa học theo cấp độ CEFR ((tabs)/explore.tsx) và Chi tiết Khóa học (course/[id].tsx)**


### 4.4.3. Giao diện Chi tiết Bài học (Video, Lý thuyết), Học từ vựng Flashcard SRS và Sổ tay từ vựng

Màn hình **Chi tiết Bài học (`lesson/[id].tsx`)** tích hợp trọn vẹn chu trình học tập chuẩn sư phạm trong một giao diện duy nhất: học viên xem Video bài giảng trực quan ở phần đầu trang, nghiên cứu nội dung lý thuyết ngữ pháp/cấu trúc câu được trình bày rõ ràng, và chuyển sang chế độ học từ vựng qua **Thẻ lật thông minh (Flashcard)**.

Trên mỗi thẻ Flashcard, học viên có thể nghe phát âm chuẩn Anh – Mỹ, xem phiên âm IPA, nghĩa tiếng Việt, câu ví dụ ngữ cảnh và bấm biểu tượng đánh dấu (`Bookmark Toggle`) để lưu từ khó vào **Sổ tay từ vựng cá nhân (`saved-words.tsx`)**. Khi đến kỳ ôn tập, cửa sổ **Ôn tập từ vựng thông minh (`VocabReviewModal.tsx`)** sẽ hiển thị các từ đến hạn (`nextReviewDate <= now`) để học viên kiểm tra trí nhớ và nâng bậc `memoryLevel` theo thuật toán SRS.


> **[KHUNG CHỜ CHÈN ẢNH Hình 4.23]**  
> *Chụp màn hình điện thoại hiển thị nội dung bài giảng Video và phần lý thuyết của bài học.*  
> **Hình 4.23: Giao diện màn hình Học bài giảng Video và Lý thuyết ngữ pháp (lesson/[id].tsx)**


> **[KHUNG CHỜ CHÈN ẢNH Hình 4.24]**  
> *Ghép 2 ảnh chụp màn hình điện thoại: Giao diện lật thẻ từ vựng Flashcard trong bài học và Giao diện ôn tập từ vựng đến hạn SRS.*  
> **Hình 4.24: Giao diện Học từ vựng qua Thẻ lật Flashcard và Cửa sổ Ôn tập Lặp lại ngắt quãng SRS (VocabReviewModal.tsx)**


> **[KHUNG CHỜ CHÈN ẢNH Hình 4.25]**  
> *Chụp màn hình điện thoại trang Từ vựng đã lưu (saved-words.tsx) hiển thị trạng thái New / Learning / Mastered của từng từ.*  
> **Hình 4.25: Giao diện màn hình Sổ tay từ vựng cá nhân đã lưu và tiến độ ghi nhớ (saved-words.tsx)**


### 4.4.4. Giao diện Luyện phát âm chuẩn âm vị IPA (GOP Practice) và Làm bài kiểm tra 4 kỹ năng

Tại thành phần **Luyện phát âm chuẩn âm vị (`GopPractices.tsx` và `practice.tsx`)**, học viên bấm nút biểu tượng Microphone để thu âm giọng đọc từ vựng hoặc câu mẫu. Sau khi gửi tệp âm thanh về điểm cuối `POST /api/ai/evaluate-pronunciation`, giao diện hiển thị trực quan:

- Điểm số GOP tổng quát (thang 0 – 100) kèm xếp loại CEFR và 4 chỉ số thành phần: Độ chuẩn Nguyên âm (`vowelAccuracy`), Độ chuẩn Phụ âm (`consonantAccuracy`), Trọng âm (`stressAccuracy`) và Độ trôi chảy (`fluencyScore`).
- Chuỗi phiên âm IPA được **tô màu trực tiếp trên từng âm vị**: màu xanh lá (`correct`) cho các âm vị phát âm chuẩn xác và màu đỏ (`poor`) cho các âm vị phát âm lệch hoặc bị nuốt âm, kèm giải thích âm mà AI thực tế nghe được (`heardAs`) và hướng dẫn điều chỉnh khẩu hình miệng (`mouthShape`).
Sau khi nắm vững lý thuyết và từ vựng, học viên thực hiện **Bài kiểm tra cuối bài học (`lesson/[id].tsx`)** hỗ trợ 5 dạng câu hỏi: Trắc nghiệm 4 lựa chọn, Điền từ vào chỗ trống, Nghe đoạn hội thoại, Thu âm bài Nói và Viết đoạn văn ngắn. Kết quả làm bài được chấm tự động, cộng điểm thưởng XP và hiển thị lời giải chi tiết.


> **[KHUNG CHỜ CHÈN ẢNH Hình 4.26]**  
> *Chụp màn hình điện thoại khi vừa thu âm phát âm xong: hiển thị điểm số GOP, từng âm vị IPA tô màu Xanh/Đỏ và lời khuyên sửa khẩu hình miệng.*  
> **Hình 4.26: Giao diện Luyện phát âm với AI hiển thị điểm GOP, bóc tách màu sắc từng âm vị IPA và gợi ý khẩu hình miệng (GopPractices.tsx)**


> **[KHUNG CHỜ CHÈN ẢNH Hình 4.27]**  
> *Ghép 2 ảnh chụp màn hình điện thoại: Giao diện làm câu hỏi kiểm tra trong bài học và Giao diện thông báo điểm số hoàn thành bài kiểm tra.*  
> **Hình 4.27: Giao diện Làm bài kiểm tra cuối bài học (Trắc nghiệm, Điền từ, Nghe, Nói, Viết) và Màn hình Kết quả điểm số**


### 4.4.5. Giao diện Trợ giảng AI 'Gà' (AI Chat), Chấm bài Viết luận và Chấm bài Nói tự do

Nút nổi **Bong bóng Chat Trợ giảng AI** xuất hiện xuyên suốt trên ứng dụng di động, cho phép học viên mở nhanh màn hình **Trợ giảng AI 'Gà' (`ai-chat.tsx`)** bất kỳ lúc nào. Màn hình này cung cấp 3 chế độ tương tác thông minh với mô hình ngôn ngữ lớn cục bộ `Ollama` và `whisper.cpp`:

- **Chế độ 1 – Hỏi đáp & Giao tiếp tự do cùng Gia sư 'Gà' (`POST /api/ai/chat`)**: Học viên có thể đặt câu hỏi về ngữ pháp, cách dùng từ hoặc luyện hội thoại tiếng Anh theo ngữ cảnh; lịch sử trò chuyện được lưu trữ theo từng phiên (`AiChatSession`) để học viên dễ dàng xem lại.
- **Chế độ 2 – Chấm chữa bài Viết luận (`POST /api/ai/grade-essay`)**: Học viên nhập chủ đề và đoạn văn tiếng Anh; AI trả về điểm tổng quát (thang 10), trình độ CEFR ước tính, điểm Ngữ pháp, điểm Từ vựng, danh sách các câu sai kèm giải thích lý do sai bằng tiếng Việt (`corrections`) và bản viết lại hoàn chỉnh (`improvedVersion`).
- **Chế độ 3 – Chấm chữa bài Nói tự do / Đọc theo mẫu (`POST /api/ai/grade-speaking`)**: Học viên thu âm đoạn nói trực tiếp trên ứng dụng; máy chủ dùng `whisper.cpp` bóc băng thành văn bản (`transcript`) và chuyển cho `Ollama` phân tích độ chính xác, độ mạch lạc (`coherenceScore`) cũng như chỉ ra từng từ phát âm sai.

> **[KHUNG CHỜ CHÈN ẢNH Hình 4.28]**  
> *Chụp màn hình điện thoại giao diện trò chuyện hỏi đáp tiếng Anh với Trợ giảng AI 'Gà' và danh sách các phiên hội thoại.*  
> **Hình 4.28: Giao diện Bong bóng Chat và Màn hình Hội thoại trực tiếp với Trợ giảng AI 'Gà' (ai-chat.tsx)**


> **[KHUNG CHỜ CHÈN ẢNH Hình 4.29]**  
> *Ghép 2 ảnh chụp màn hình điện thoại: Kết quả AI chấm bài Viết luận (hiển thị điểm, lỗi sai, bản viết lại) và Kết quả AI chấm bài Nói.*  
> **Hình 4.29: Giao diện Chấm bài Viết luận (Essay Grading) và Chấm bài Nói (Speaking Grading) bằng AI trên Mobile**


### 4.4.6. Giao diện Khu trò chơi giáo dục 4 Mini-Games (Gamification)

Nhằm xóa bỏ sự nhàm chán khi học thuộc từ vựng truyền thống, màn hình **Khu trò chơi giáo dục (`games.tsx`)** tích hợp 4 trò chơi tương tác sử dụng dữ liệu từ vựng thực tế trong cơ sở dữ liệu:

- **1. Trò chơi Lật thẻ trí nhớ (`game/memory-card.tsx`)**: Học viên lật tìm các cặp thẻ Từ tiếng Anh – Nghĩa tiếng Việt tương ứng trong số lượt lật và thời gian giới hạn.
- **2. Trò chơi Nối từ tốc độ (`game/word-matching.tsx`)**: Học viên chạm nối nhanh các cặp từ vựng và nghĩa trên hai cột để rèn luyện tốc độ phản xạ nhận diện mặt chữ.
- **3. Trò chơi Bắn bóng từ vựng (`game/bubble-game.tsx`)**: Các bong bóng mang từ vựng chuyển động trên màn hình; học viên phải bắn trúng bong bóng khớp với nghĩa tiếng Việt được yêu cầu trước khi hết giờ.
- **4. Trò chơi Phiêu lưu vượt chướng ngại vật (`game/mario.tsx`)**: Kết hợp yếu tố giải trí điều khiển nhân vật vượt thử thách và trả lời câu hỏi từ vựng để tích lũy điểm thưởng XP.

> **[KHUNG CHỜ CHÈN ẢNH Hình 4.30]**  
> *Ghép ảnh chụp màn hình điện thoại: Danh sách Mini-Games, màn hình chơi Memory Card và màn hình chơi Word Matching.*  
> **Hình 4.30: Giao diện Sảnh chọn Trò chơi (games.tsx), Trò chơi Lật thẻ (memory-card.tsx) và Nối từ (word-matching.tsx)**


> **[KHUNG CHỜ CHÈN ẢNH Hình 4.31]**  
> *Ghép 2 ảnh chụp màn hình điện thoại: Màn hình chơi Bubble Game và màn hình chơi Mario Game.*  
> **Hình 4.31: Giao diện Trò chơi Bắn bóng từ vựng (bubble-game.tsx) và Trò chơi Mario phiêu lưu học từ (mario.tsx)**


### 4.4.7. Giao diện Bảng xếp hạng (Leaderboard), Diễn đàn Cộng đồng (Community) và Hồ sơ cá nhân (Profile)

Để thúc đẩy động lực học tập thông qua sự gắn kết xã hội, ứng dụng di động cung cấp ba phân hệ tương tác và quản lý cá nhân:

- **Màn hình Bảng xếp hạng (`(tabs)/leaderboard.tsx`)**: Vinh danh Top 3 học viên dẫn đầu trên bục huy chương (Vàng, Bạc, Đồng) và danh sách xếp hạng toàn hệ thống dựa trên tổng điểm kinh nghiệm `xpPoints` và trình độ CEFR.
- **Màn hình Diễn đàn Cộng đồng (`(tabs)/community.tsx`)**: Cho phép học viên đăng bài chia sẻ kinh nghiệm học tiếng Anh kèm hình ảnh (`PostImage`), tùy chỉnh quyền riêng tư (`isPublic`), thả tim (`PostLike`) và bình luận trao đổi (`CommunityComment`) với các học viên khác.
- **Màn hình Hồ sơ cá nhân (`(tabs)/profile.tsx`), Huy hiệu (`achievements.tsx`), Lịch sử học tập (`history.tsx`) và Chứng chỉ (`CertificateModal.tsx`)**: Hiển thị biểu đồ năng lực Elo 4 kỹ năng hiện tại của học viên, bộ sưu tập các huy hiệu thành tích đã mở khóa, lịch sử điểm số các bài kiểm tra/trò chơi, cài đặt thông báo/giao diện Sáng-Tối (`settings.tsx`) và cấp giấy chứng nhận hoàn thành khóa học.

> **[KHUNG CHỜ CHÈN ẢNH Hình 4.32]**  
> *Ghép 2 ảnh chụp màn hình điện thoại: Bảng xếp hạng Top XP (Leaderboard) và Diễn đàn Cộng đồng (Community Posts, Likes, Comments).*  
> **Hình 4.32: Giao diện màn hình Bảng xếp hạng học viên ((tabs)/leaderboard.tsx) và Diễn đàn Cộng đồng ((tabs)/community.tsx)**


> **[KHUNG CHỜ CHÈN ẢNH Hình 4.33]**  
> *Ghép ảnh chụp màn hình điện thoại: Trang Hồ sơ cá nhân (hiển thị chỉ số Elo 4 kỹ năng, Streak, XP) và trang Danh hiệu / Lịch sử kiểm tra.*  
> **Hình 4.33: Giao diện màn hình Hồ sơ cá nhân ((tabs)/profile.tsx), Bộ sưu tập Danh hiệu (achievements.tsx) và Lịch sử học tập (history.tsx)**


> **[KHUNG CHỜ CHÈN ẢNH Hình 4.34]**  
> *Ghép ảnh chụp màn hình điện thoại: Cửa sổ Thông báo nhận từ Admin, Chứng chỉ hoàn thành khóa học và Cài đặt chế độ Sáng/Tối.*  
> **Hình 4.34: Giao diện Cửa sổ Thông báo học tập (NotificationModal.tsx), Chứng chỉ hoàn thành (CertificateModal.tsx) và Cài đặt (settings.tsx)**


### 4.5. KẾT LUẬN CHƯƠNG 4

Trong Chương 4, nhóm tác giả đã trình bày chi tiết toàn bộ quá trình cài đặt, cấu hình môi trường và hiện thực hóa mã nguồn cho hệ thống học tiếng Anh đa nền tảng **EngMaster**. Hệ thống đã kết nối thông suốt giữa máy chủ **Backend RESTful API** (`Node.js/Express/Prisma/MySQL`), nền tảng **Web Quản trị** (`React 19/Vite`) và ứng dụng **Mobile Học viên** (`React Native/Expo SDK 58`). Đặc biệt, các thuật toán thông minh gồm **FAME-KT** (đánh giá thích ứng đa chiều kết hợp IRT c = 0.25, tâm lý học thời gian phản xạ, dừng sớm CAT và hệ khuyến nghị lai), thuật toán **GOP & Needleman-Wunsch** (chấm điểm phát âm chuẩn âm vị IPA), mô hình nhận diện giọng nói **whisper.cpp** và mô hình ngôn ngữ lớn cục bộ **Ollama LLM** đều đã được cài đặt hoàn chỉnh và vận hành ổn định, tạo tiền đề vững chắc cho giai đoạn kiểm thử và đánh giá thực nghiệm ở chương tiếp theo.
