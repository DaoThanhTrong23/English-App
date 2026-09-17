# Báo cáo Cập nhật Dự án (17/09/2026)

## 1. Backend (API & Database)
- **Cơ sở dữ liệu (Prisma)**: Thêm bảng Topic, cập nhật bảng Lesson (thêm 	opicId, content, ideoUrl), cập nhật bảng Test (thêm lessonId), thêm udioUrl, imageUrl cho Question, thêm bảng Achievement và UserAchievement.
- **Module Topic**: Hoàn thiện API Thêm/Sửa/Xóa Chủ đề.
- **Module Achievement**: Hoàn thiện API Thêm/Sửa/Xóa Danh hiệu.
- **Module Course (Lesson)**: Cập nhật luồng trả về 	opicId, words và khả năng lưu content (lý thuyết), ideoUrl (bài giảng). Thêm chức năng gán từ vựng vào bài học.
- **Module Test**: Tích hợp upload MP3 và ảnh cho câu hỏi (hỗ trợ Nghe, Nói, Đọc, Viết).

## 2. Frontend (React Admin)
- **Quản lý Chủ đề**: Thêm màn hình TopicList để quản lý các chủ đề.
- **Quản lý Bài học**: Viết lại hoàn toàn CourseDetail.tsx. Đã chia làm 3 tab: Thông tin chung (nhập video, lý thuyết), Tab Từ vựng (thêm từ vào bài từ kho) và Tab Bài tập (quản lý bộ bài thi 4 kỹ năng của lesson).
- **Quản lý Danh hiệu**: Thêm màn hình AchievementList để Admin tạo danh hiệu mới, cấu hình XP và Streak.
- **Quản lý Bài tập (Tests)**: Cập nhật tính năng Import câu hỏi từ Excel. Thêm chức năng tải file âm thanh mp3 hoặc file ảnh cho từng câu hỏi.