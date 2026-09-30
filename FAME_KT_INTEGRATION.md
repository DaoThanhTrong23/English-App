# Báo cáo Tích hợp Thuật toán Adaptive Learning (FAME-KT)

Tài liệu này ghi chú lại quá trình tích hợp lõi thuật toán **FAME-KT (Fuzzy Adaptive Multi-dimensional Elo)** từ mô hình nghiên cứu độc lập vào hệ thống thực tế của Ứng dụng Học Tiếng Anh.

## 1. Tổng quan (Overview)
Hệ thống đã triển khai thành công quy trình **Onboarding cá nhân hóa** dành cho người dùng mới. Thay vì bắt người học bắt đầu từ một lộ trình cố định, hệ thống tiến hành kiểm tra năng lực đầu vào kết hợp thu thập thông tin cá nhân (Sở thích, Nghề nghiệp) để tạo ra một lộ trình học tập độc bản (Personalized Learning Path).

## 2. Thay đổi Cấu trúc Dữ liệu (Database Schema)
Bảng `User` đã được mở rộng để lưu trữ Profile học tập và thông tin Onboarding:
- `job` (String): Nghề nghiệp hiện tại.
- `interests` (String): Danh sách sở thích cá nhân.
- `cefrLevel` (String): Trình độ tiếng Anh chuẩn Châu Âu (A1, A2, B1, B2, C1, C2) được hệ thống đánh giá sau bài Test.
- `onboardingCompleted` (Boolean): Cờ (Flag) xác định người dùng đã hoàn tất bài đánh giá năng lực hay chưa.

## 3. Tầng Lõi Thuật toán & Backend (Core Algorithm & Services)
Thuật toán FAME-KT được tích hợp vào Backend (`fame-kt.ts` & `onboarding.service.ts`) xử lý 3 rào cản lớn trong kiểm tra trắc nghiệm:

### 3.1. Loại bỏ yếu tố đoán lụi (IRT Guessing Factor)
Thuật toán áp dụng Lý thuyết Phản ứng Câu hỏi (Item Response Theory - IRT), thiết lập hệ số $c = 0.25$ (Xác suất 25% đoán đúng với câu hỏi 4 đáp án). Hệ thống tự động trừ hao xác suất đoán mò để phản ánh chính xác thực lực.

### 3.2. Chấm điểm Dựa trên Phản xạ (Time-factor Psychometrics)
Ghi nhận thời gian trả lời (`timeTakenMs`) của mỗi câu hỏi để điều chỉnh hệ số K (K-factor) của Elo:
- **< 2 giây (Chống Bot/Đoán lụi):** Hệ số nhân giảm cực thấp, hầu như không cộng điểm.
- **5 - 15 giây (Dòng chảy tối ưu - Optimal Flow):** Trạng thái người dùng nắm vững kiến thức, hệ số K đạt đỉnh.
- **> 15 giây (Thiếu tự tin / Phân tâm):** Hệ số K giảm dần theo thời gian trễ.

### 3.3. Đánh giá Đa chiều (Multi-dimensional Tracking)
Kết quả không quy về một điểm số duy nhất mà tách thành 4 chiều (Dimensions): Ngữ pháp (Grammar), Từ vựng (Vocabulary), Nghe (Listening), Đọc (Reading).

### 3.4. Hệ tư vấn Lai (Hybrid Recommender System)
Thuật toán Recommender tìm ra **Kỹ năng yếu nhất (Weakest Link)** trong 4 kỹ năng trên, sau đó chấm điểm các Khóa học có sẵn trong Database dựa trên 3 tiêu chí:
1. Chữa đúng kỹ năng yếu nhất (+20 điểm).
2. Khớp trình độ CEFR của người học (+10 điểm).
3. Khớp với chủ đề "Sở thích" của người học (+5 điểm).

## 4. Tầng Giao diện Người dùng (Mobile App)
Tạo mới màn hình `onboarding.tsx` bao gồm 3 phân đoạn:
1. **Thu thập (Collect):** Nhập Nghề nghiệp và Sở thích.
2. **Khảo sát (Assess):** Làm bài trắc nghiệm 10 câu (Dữ liệu câu hỏi được lấy trực tiếp từ Dataset Kaggle qua `questionBank.json`).
3. **Trả kết quả (Visualize):** Hiển thị điểm CEFR tổng quát, Bảng radar 4 chỉ số Elo năng lực và 3 Khóa học được Recommendation System đề xuất riêng cho người dùng.

## 5. Nguồn Dữ liệu (Data Source)
Hệ thống sử dụng bộ dữ liệu mẫu câu hỏi tiếng Anh lấy từ Kaggle (EdNet/TOEIC Adaptive Data), được định dạng lại thành JSON và load trực tiếp vào bộ nhớ của Backend khi khởi động để phục vụ cho các phiên Onboarding.
