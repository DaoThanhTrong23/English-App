import { PermissionName } from "../../generated/prisma/index.js";

export interface PermissionDefinition {
  name: PermissionName;
  description: string;
  module: string;
}

export const ALL_PERMISSIONS: PermissionDefinition[] = [
  // === 1. AUTH & PROFILE ===
  { name: PermissionName.DELETE_AUTH_LOGOUT, description: "Đăng xuất khỏi hệ thống", module: "auth" },
  { name: PermissionName.UPDATE_AUTH_PASSWORD, description: "Thay đổi mật khẩu tài khoản", module: "auth" },
  { name: PermissionName.READ_PROFILE, description: "Xem thông tin hồ sơ cá nhân", module: "profile" },
  { name: PermissionName.UPDATE_PROFILE, description: "Cập nhật thông tin hồ sơ cá nhân", module: "profile" },
  { name: PermissionName.READ_PROFILE_HISTORY, description: "Xem lịch sử học tập cá nhân", module: "profile" },
  { name: PermissionName.READ_PROFILE_ACHIEVEMENTS, description: "Xem danh hiệu cá nhân", module: "profile" },
  { name: PermissionName.READ_PROFILE_SAVED_WORDS, description: "Xem từ vựng đã lưu cá nhân", module: "profile" },
  { name: PermissionName.UPDATE_PROFILE_LOCK, description: "Yêu cầu tự khóa tài khoản", module: "profile" },
  { name: PermissionName.DELETE_PROFILE_ACCOUNT, description: "Yêu cầu xóa tài khoản", module: "profile" },

  // === 2. ADMIN - STUDENT MANAGE ===
  { name: PermissionName.READ_STUDENT_LIST, description: "Xem danh sách học viên", module: "student_manage" },
  { name: PermissionName.READ_STUDENT_COUNT, description: "Xem tổng số lượng học viên", module: "student_manage" },
  { name: PermissionName.READ_STUDENT_TOP, description: "Xem danh sách học viên tiêu biểu", module: "student_manage" },
  { name: PermissionName.READ_STUDENT_DETAIL, description: "Xem chi tiết thông tin học viên", module: "student_manage" },
  { name: PermissionName.READ_STUDENT_PROGRESS, description: "Xem tiến độ học tập của học viên", module: "student_manage" },
  { name: PermissionName.READ_STUDENT_AI_CHAT, description: "Xem lịch sử trò chuyện AI của học viên", module: "student_manage" },
  { name: PermissionName.UPDATE_STUDENT_STATUS, description: "Khóa hoặc mở khóa tài khoản học viên", module: "student_manage" },

  // === 3. ADMIN - WORD ===
  { name: PermissionName.READ_WORD_LIST, description: "Xem danh sách từ vựng", module: "word" },
  { name: PermissionName.READ_WORD_COUNT, description: "Xem tổng số từ vựng", module: "word" },
  { name: PermissionName.READ_WORD_DETAIL, description: "Xem chi tiết từ vựng", module: "word" },
  { name: PermissionName.CREATE_WORD, description: "Tạo từ vựng mới", module: "word" },
  { name: PermissionName.UPDATE_WORD, description: "Chỉnh sửa từ vựng", module: "word" },
  { name: PermissionName.DELETE_WORD, description: "Xóa từ vựng", module: "word" },
  { name: PermissionName.CREATE_WORD_BULK, description: "Thêm hàng loạt từ vựng", module: "word" },
  { name: PermissionName.READ_WORD_EXPORT, description: "Xuất dữ liệu từ vựng", module: "word" },

  // === 4. ADMIN - COURSE & LESSON ===
  { name: PermissionName.READ_COURSE_LIST, description: "Xem danh sách khóa học", module: "course" },
  { name: PermissionName.READ_COURSE_COUNT, description: "Xem tổng số khóa học / bài học", module: "course" },
  { name: PermissionName.READ_COURSE_DETAIL, description: "Xem chi tiết khóa học", module: "course" },
  { name: PermissionName.CREATE_COURSE, description: "Tạo khóa học mới", module: "course" },
  { name: PermissionName.UPDATE_COURSE, description: "Cập nhật thông tin khóa học", module: "course" },
  { name: PermissionName.DELETE_COURSE, description: "Xóa khóa học", module: "course" },
  { name: PermissionName.UPDATE_COURSE_RESTORE, description: "Khôi phục khóa học đã xóa", module: "course" },
  { name: PermissionName.CREATE_COURSE_WORDS, description: "Thêm từ vựng vào khóa học", module: "course" },
  { name: PermissionName.DELETE_COURSE_WORDS, description: "Xóa từ vựng khỏi khóa học", module: "course" },

  // === 5. ADMIN - TOPIC ===
  { name: PermissionName.READ_TOPIC_LIST, description: "Xem danh sách chủ đề", module: "topic" },
  { name: PermissionName.READ_TOPIC_COUNT, description: "Xem tổng số chủ đề", module: "topic" },
  { name: PermissionName.READ_TOPIC_DETAIL, description: "Xem chi tiết chủ đề", module: "topic" },
  { name: PermissionName.CREATE_TOPIC, description: "Tạo chủ đề mới", module: "topic" },
  { name: PermissionName.UPDATE_TOPIC, description: "Cập nhật chủ đề", module: "topic" },
  { name: PermissionName.DELETE_TOPIC, description: "Xóa chủ đề", module: "topic" },

  // === 6. ADMIN - TEST & QUESTION ===
  { name: PermissionName.READ_TEST_LIST, description: "Xem danh sách bài kiểm tra", module: "test" },
  { name: PermissionName.READ_TEST_COUNT, description: "Xem tổng số bài kiểm tra", module: "test" },
  { name: PermissionName.READ_TEST_DETAIL, description: "Xem chi tiết bài kiểm tra", module: "test" },
  { name: PermissionName.READ_TEST_STATS, description: "Xem thống kê bài kiểm tra", module: "test" },
  { name: PermissionName.CREATE_TEST, description: "Tạo bài kiểm tra mới", module: "test" },
  { name: PermissionName.UPDATE_TEST, description: "Cập nhật bài kiểm tra", module: "test" },
  { name: PermissionName.DELETE_TEST, description: "Xóa bài kiểm tra", module: "test" },
  { name: PermissionName.CREATE_TEST_MEDIA, description: "Upload media cho câu hỏi bài thi", module: "test" },
  { name: PermissionName.CREATE_TEST_QUESTION_IMPORT, description: "Import câu hỏi từ file Excel", module: "test" },
  { name: PermissionName.READ_TEST_QUESTIONS, description: "Xem danh sách câu hỏi của bài thi", module: "test" },
  { name: PermissionName.CREATE_TEST_QUESTION, description: "Tạo câu hỏi mới cho bài thi", module: "test" },
  { name: PermissionName.UPDATE_TEST_QUESTION, description: "Cập nhật câu hỏi bài thi", module: "test" },
  { name: PermissionName.DELETE_TEST_QUESTION, description: "Xóa câu hỏi bài thi", module: "test" },
  { name: PermissionName.READ_TEST_RESULTS, description: "Xem danh sách kết quả làm bài thi", module: "test" },

  // === 7. ADMIN - ACHIEVEMENT ===
  { name: PermissionName.READ_ACHIEVEMENT_LIST, description: "Xem danh sách thành tựu", module: "achievement" },
  { name: PermissionName.READ_ACHIEVEMENT_DETAIL, description: "Xem chi tiết thành tựu", module: "achievement" },
  { name: PermissionName.CREATE_ACHIEVEMENT, description: "Tạo thành tựu mới", module: "achievement" },
  { name: PermissionName.UPDATE_ACHIEVEMENT, description: "Cập nhật thành tựu", module: "achievement" },
  { name: PermissionName.DELETE_ACHIEVEMENT, description: "Xóa thành tựu", module: "achievement" },

  // === 8. ADMIN - ACTIVITY LOG ===
  { name: PermissionName.READ_ACTIVITY_LOG_LIST, description: "Xem nhật ký hoạt động hệ thống", module: "activity_log" },
  { name: PermissionName.READ_ACTIVITY_LOG_COUNT, description: "Xem tổng số lượng log", module: "activity_log" },
  { name: PermissionName.READ_ACTIVITY_LOG_EXPORT, description: "Xuất dữ liệu nhật ký hoạt động", module: "activity_log" },

  // === 9. ADMIN - DASHBOARD ===
  { name: PermissionName.READ_DASHBOARD_STATS, description: "Xem số liệu thống kê Dashboard Admin", module: "dashboard" },

  // === 10. ADMIN - KEYWORD SETTING ===
  { name: PermissionName.READ_KEYWORD_SETTING_LIST, description: "Xem cấu hình từ khóa", module: "keyword_setting" },
  { name: PermissionName.READ_KEYWORD_SETTING_DOWNLOAD, description: "Tải file từ khóa mẫu CSV", module: "keyword_setting" },
  { name: PermissionName.CREATE_KEYWORD_SETTING, description: "Tạo nhóm từ khóa mới", module: "keyword_setting" },
  { name: PermissionName.UPDATE_KEYWORD_SETTING, description: "Cập nhật nhóm từ khóa", module: "keyword_setting" },
  { name: PermissionName.DELETE_KEYWORD_SETTING, description: "Xóa nhóm từ khóa", module: "keyword_setting" },

  // === 11. ADMIN - TOPIC SETTING ===
  { name: PermissionName.READ_TOPIC_SETTING_LIST, description: "Xem cấu hình số lượng topic theo cấp độ", module: "topic_setting" },
  { name: PermissionName.UPDATE_TOPIC_SETTING, description: "Cập nhật cấu hình số lượng topic theo cấp độ", module: "topic_setting" },

  // === 12. ADMIN - GAME SETTING ===
  { name: PermissionName.READ_GAME_SETTING_LIST, description: "Xem cấu hình các trò chơi", module: "game" },
  { name: PermissionName.UPDATE_GAME_SETTING, description: "Cập nhật độ khó và điểm số trò chơi", module: "game" },

  // === 13. ADMIN - NOTIFICATION ===
  { name: PermissionName.CREATE_ADMIN_NOTIFICATION, description: "Gửi thông báo hệ thống đến người dùng", module: "notification" },

  // === 14. ADMIN - AI GENERATION & STATS ===
  { name: PermissionName.READ_AI_ADMIN_STATS, description: "Xem thống kê tổng quan AI Chat", module: "ai" },
  { name: PermissionName.READ_AI_ADMIN_SESSIONS, description: "Xem danh sách các phiên trò chuyện AI", module: "ai" },
  { name: PermissionName.READ_AI_ADMIN_SESSION_MESSAGES, description: "Xem tin nhắn trong phiên trò chuyện AI", module: "ai" },
  { name: PermissionName.DELETE_AI_ADMIN_SESSION, description: "Xóa cuộc trò chuyện AI", module: "ai" },

  // === ADMIN - ROLE MANAGEMENT ===
  { name: PermissionName.READ_ROLE_LIST, description: "Xem danh sách vai trò (roles)", module: "role_manage" },
  { name: PermissionName.READ_ROLE_DETAIL, description: "Xem chi tiết vai trò", module: "role_manage" },
  { name: PermissionName.CREATE_ROLE, description: "Tạo vai trò mới", module: "role_manage" },
  { name: PermissionName.UPDATE_ROLE, description: "Chỉnh sửa vai trò", module: "role_manage" },
  { name: PermissionName.DELETE_ROLE, description: "Xóa vai trò", module: "role_manage" },

  // === 15. STUDENT - VOCABULARY ===
  { name: PermissionName.READ_STUDENT_VOCABULARY_LIST, description: "Xem danh sách từ vựng cá nhân", module: "student_vocabulary" },
  { name: PermissionName.READ_STUDENT_VOCABULARY_REVIEW, description: "Lấy danh sách từ vựng cần ôn tập", module: "student_vocabulary" },
  { name: PermissionName.READ_STUDENT_VOCABULARY_STATS, description: "Xem thống kê học từ vựng", module: "student_vocabulary" },
  { name: PermissionName.CREATE_STUDENT_VOCABULARY, description: "Lưu từ vựng mới vào sổ tay", module: "student_vocabulary" },
  { name: PermissionName.UPDATE_STUDENT_VOCABULARY_STATUS, description: "Cập nhật trạng thái từ vựng (đang học/thuộc)", module: "student_vocabulary" },
  { name: PermissionName.CREATE_STUDENT_VOCABULARY_REVIEW, description: "Ghi nhận kết quả ôn tập từ vựng", module: "student_vocabulary" },
  { name: PermissionName.DELETE_STUDENT_VOCABULARY, description: "Xóa từ vựng khỏi sổ tay", module: "student_vocabulary" },
  { name: PermissionName.UPDATE_STUDENT_VOCABULARY_SYNC, description: "Đồng bộ tiến trình từ vựng", module: "student_vocabulary" },

  // === 16. STUDENT - COURSE & LESSON ===
  { name: PermissionName.READ_STUDENT_COURSE_LIST, description: "Xem danh sách khóa học dành cho học viên", module: "student_lesson" },
  { name: PermissionName.READ_STUDENT_COURSE_DETAIL, description: "Xem chi tiết khóa học dành cho học viên", module: "student_lesson" },
  { name: PermissionName.READ_STUDENT_COURSE_LESSONS, description: "Xem danh sách bài học của khóa học", module: "student_lesson" },
  { name: PermissionName.READ_STUDENT_LESSON_DETAIL, description: "Xem nội dung chi tiết bài học", module: "student_lesson" },
  { name: PermissionName.UPDATE_STUDENT_LESSON_PROGRESS, description: "Cập nhật tiến trình học bài học", module: "student_lesson" },

  // === 17. STUDENT - TEST ===
  { name: PermissionName.READ_STUDENT_TEST_DETAIL, description: "Xem đề thi bài kiểm tra", module: "student_test" },
  { name: PermissionName.CREATE_STUDENT_TEST_SUBMISSION, description: "Nộp bài kiểm tra và chấm điểm", module: "student_test" },
  { name: PermissionName.READ_STUDENT_TEST_HISTORY, description: "Xem lịch sử kết quả làm bài thi", module: "student_test" },

  // === 18. GAMES ===
  { name: PermissionName.READ_GAME_LIST, description: "Xem danh sách các trò chơi học tập", module: "game" },
  { name: PermissionName.READ_GAME_HISTORY, description: "Xem lịch sử chơi game", module: "game" },
  { name: PermissionName.READ_BUBBLE_GAME, description: "Chơi trò chơi Bắn bóng từ vựng", module: "bubble_game" },
  { name: PermissionName.UPDATE_BUBBLE_GAME_PROGRESS, description: "Cập nhật tiến trình trò chơi Bắn bóng", module: "bubble_game" },
  { name: PermissionName.CREATE_BUBBLE_GAME_RESULT, description: "Lưu kết quả trò chơi Bắn bóng", module: "bubble_game" },
  { name: PermissionName.READ_MEMORY_CARD_GAME, description: "Chơi trò chơi Lật thẻ trí nhớ", module: "memory_card" },
  { name: PermissionName.UPDATE_MEMORY_CARD_PROGRESS, description: "Cập nhật tiến trình trò chơi Lật thẻ", module: "memory_card" },
  { name: PermissionName.CREATE_MEMORY_CARD_RESULT, description: "Lưu kết quả trò chơi Lật thẻ", module: "memory_card" },
  { name: PermissionName.READ_WORD_MATCHING_GAME, description: "Chơi trò chơi Ghép từ tương ứng", module: "word_matching" },
  { name: PermissionName.UPDATE_WORD_MATCHING_PROGRESS, description: "Cập nhật tiến trình trò chơi Ghép từ", module: "word_matching" },
  { name: PermissionName.CREATE_WORD_MATCHING_RESULT, description: "Lưu kết quả trò chơi Ghép từ", module: "word_matching" },
  { name: PermissionName.READ_MARIO_GAME, description: "Chơi trò chơi Mario tiếng Anh", module: "mario_game" },
  { name: PermissionName.UPDATE_MARIO_GAME_PROGRESS, description: "Cập nhật tiến trình trò chơi Mario", module: "mario_game" },
  { name: PermissionName.CREATE_MARIO_GAME_RESULT, description: "Lưu kết quả trò chơi Mario", module: "mario_game" },

  // === 19. AI CHAT & SERVICES ===
  { name: PermissionName.CREATE_AI_ESSAY_GRADE, description: "Chấm điểm bài viết bằng AI", module: "ai" },
  { name: PermissionName.CREATE_AI_SPEAKING_GRADE, description: "Chấm điểm bài nói bằng AI", module: "ai" },
  { name: PermissionName.CREATE_AI_PRONUNCIATION, description: "Đánh giá phát âm bằng AI", module: "ai" },
  { name: PermissionName.READ_AI_TTS, description: "Tạo âm thanh phát âm từ văn bản", module: "ai" },
  { name: PermissionName.CREATE_AI_CHAT, description: "Trò chuyện với trợ lý AI", module: "ai" },
  { name: PermissionName.READ_AI_CHAT_SESSIONS, description: "Xem danh sách phiên chat AI của bản thân", module: "ai" },
  { name: PermissionName.READ_AI_CHAT_HISTORY, description: "Xem chi tiết tin nhắn chat AI của bản thân", module: "ai" },
  { name: PermissionName.DELETE_AI_CHAT_SESSION, description: "Xóa phiên chat AI của bản thân", module: "ai" },

  // === 20. COMMUNITY ===
  { name: PermissionName.READ_COMMUNITY_POST_LIST, description: "Xem bảng tin cộng đồng học tập", module: "community" },
  { name: PermissionName.CREATE_COMMUNITY_POST, description: "Đăng bài viết lên cộng đồng", module: "community" },
  { name: PermissionName.UPDATE_COMMUNITY_POST_LIKE, description: "Thích hoặc bỏ thích bài viết", module: "community" },
  { name: PermissionName.READ_COMMUNITY_COMMENTS, description: "Xem bình luận bài viết", module: "community" },
  { name: PermissionName.CREATE_COMMUNITY_COMMENT, description: "Bình luận trên bài viết", module: "community" },
  { name: PermissionName.UPDATE_COMMUNITY_POST, description: "Chỉnh sửa bài viết cá nhân", module: "community" },
  { name: PermissionName.UPDATE_COMMUNITY_POST_PRIVACY, description: "Thay đổi quyền riêng tư bài viết", module: "community" },
  { name: PermissionName.DELETE_COMMUNITY_POST, description: "Xóa bài viết cá nhân", module: "community" },

  // === 21. LEADERBOARD ===
  { name: PermissionName.READ_LEADERBOARD, description: "Xem bảng xếp hạng học tập", module: "leaderboard" },

  // === 22. QUEST ===
  { name: PermissionName.READ_QUEST_LIST, description: "Xem danh sách nhiệm vụ hàng ngày", module: "quest" },
  { name: PermissionName.UPDATE_QUEST_CLAIM, description: "Nhận phần thưởng nhiệm vụ", module: "quest" },

  // === 23. NOTIFICATION ===
  { name: PermissionName.READ_NOTIFICATION_LIST, description: "Xem danh sách thông báo", module: "notification" },
  { name: PermissionName.UPDATE_NOTIFICATION_READ, description: "Đánh dấu thông báo đã đọc", module: "notification" },
  { name: PermissionName.UPDATE_NOTIFICATION_READ_ALL, description: "Đánh dấu tất cả thông báo là đã đọc", module: "notification" },
  { name: PermissionName.DELETE_NOTIFICATION, description: "Xóa thông báo", module: "notification" },
  { name: PermissionName.DELETE_NOTIFICATION_ALL, description: "Xóa tất cả thông báo", module: "notification" },
  { name: PermissionName.READ_NOTIFICATION_PREFERRED_TIME, description: "Xem gợi ý giờ học quen thuộc", module: "notification" },

  // === 24. ONBOARDING ===
  { name: PermissionName.READ_ONBOARDING, description: "Xem trạng thái Onboarding", module: "onboarding" },
  { name: PermissionName.UPDATE_ONBOARDING, description: "Hoàn tất các bước Onboarding khảo sát ban đầu", module: "onboarding" },
];

/**
 * Danh sách permissions dành cho Role 'user':
 * Bao gồm toàn bộ quyền học tập, cá nhân, trò chơi, AI, cộng đồng.
 */
export const USER_PERMISSIONS: PermissionName[] = [
  // Auth & Profile
  PermissionName.DELETE_AUTH_LOGOUT,
  PermissionName.UPDATE_AUTH_PASSWORD,
  PermissionName.READ_PROFILE,
  PermissionName.UPDATE_PROFILE,
  PermissionName.READ_PROFILE_HISTORY,
  PermissionName.READ_PROFILE_ACHIEVEMENTS,
  PermissionName.READ_PROFILE_SAVED_WORDS,
  PermissionName.UPDATE_PROFILE_LOCK,
  PermissionName.DELETE_PROFILE_ACCOUNT,

  // Game list & play
  PermissionName.READ_GAME_LIST,
  PermissionName.READ_GAME_HISTORY,
  PermissionName.READ_BUBBLE_GAME,
  PermissionName.UPDATE_BUBBLE_GAME_PROGRESS,
  PermissionName.CREATE_BUBBLE_GAME_RESULT,
  PermissionName.READ_MEMORY_CARD_GAME,
  PermissionName.UPDATE_MEMORY_CARD_PROGRESS,
  PermissionName.CREATE_MEMORY_CARD_RESULT,
  PermissionName.READ_WORD_MATCHING_GAME,
  PermissionName.UPDATE_WORD_MATCHING_PROGRESS,
  PermissionName.CREATE_WORD_MATCHING_RESULT,
  PermissionName.READ_MARIO_GAME,
  PermissionName.UPDATE_MARIO_GAME_PROGRESS,
  PermissionName.CREATE_MARIO_GAME_RESULT,

  // Student vocabulary
  PermissionName.READ_STUDENT_VOCABULARY_LIST,
  PermissionName.READ_STUDENT_VOCABULARY_REVIEW,
  PermissionName.READ_STUDENT_VOCABULARY_STATS,
  PermissionName.CREATE_STUDENT_VOCABULARY,
  PermissionName.UPDATE_STUDENT_VOCABULARY_STATUS,
  PermissionName.CREATE_STUDENT_VOCABULARY_REVIEW,
  PermissionName.DELETE_STUDENT_VOCABULARY,
  PermissionName.UPDATE_STUDENT_VOCABULARY_SYNC,

  // Student Course & Lesson
  PermissionName.READ_STUDENT_COURSE_LIST,
  PermissionName.READ_STUDENT_COURSE_DETAIL,
  PermissionName.READ_STUDENT_COURSE_LESSONS,
  PermissionName.READ_STUDENT_LESSON_DETAIL,
  PermissionName.UPDATE_STUDENT_LESSON_PROGRESS,

  // Student Test
  PermissionName.READ_STUDENT_TEST_DETAIL,
  PermissionName.CREATE_STUDENT_TEST_SUBMISSION,
  PermissionName.READ_STUDENT_TEST_HISTORY,

  // AI Chat & Services
  PermissionName.CREATE_AI_ESSAY_GRADE,
  PermissionName.CREATE_AI_SPEAKING_GRADE,
  PermissionName.CREATE_AI_PRONUNCIATION,
  PermissionName.READ_AI_TTS,
  PermissionName.CREATE_AI_CHAT,
  PermissionName.READ_AI_CHAT_SESSIONS,
  PermissionName.READ_AI_CHAT_HISTORY,
  PermissionName.DELETE_AI_CHAT_SESSION,

  // Community
  PermissionName.READ_COMMUNITY_POST_LIST,
  PermissionName.CREATE_COMMUNITY_POST,
  PermissionName.UPDATE_COMMUNITY_POST_LIKE,
  PermissionName.READ_COMMUNITY_COMMENTS,
  PermissionName.CREATE_COMMUNITY_COMMENT,
  PermissionName.UPDATE_COMMUNITY_POST,
  PermissionName.UPDATE_COMMUNITY_POST_PRIVACY,
  PermissionName.DELETE_COMMUNITY_POST,

  // Leaderboard
  PermissionName.READ_LEADERBOARD,

  // Quest
  PermissionName.READ_QUEST_LIST,
  PermissionName.UPDATE_QUEST_CLAIM,

  // Notification
  PermissionName.READ_NOTIFICATION_LIST,
  PermissionName.UPDATE_NOTIFICATION_READ,
  PermissionName.UPDATE_NOTIFICATION_READ_ALL,
  PermissionName.DELETE_NOTIFICATION,
  PermissionName.DELETE_NOTIFICATION_ALL,
  PermissionName.READ_NOTIFICATION_PREFERRED_TIME,

  // Onboarding
  PermissionName.READ_ONBOARDING,
  PermissionName.UPDATE_ONBOARDING,
];

/**
 * Danh sách permissions dành cho Role 'admin':
 * Bao gồm TẤT CẢ permissions trong hệ thống (toàn quyền quản trị + toàn quyền học viên).
 */
export const ADMIN_PERMISSIONS: PermissionName[] = ALL_PERMISSIONS.map(p => p.name);
