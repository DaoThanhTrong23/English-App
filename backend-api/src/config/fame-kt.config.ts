/**
 * CẤU HÌNH THÔNG SỐ THUẬT TOÁN ĐÁNH GIÁ NĂNG LỰC & GỢI Ý LỘ TRÌNH (FAME-KT / CAT)
 * ==============================================================================
 * Toàn bộ các thông số liên quan đến:
 * - Khoảng thời gian đoán lụi / làm nhanh / vùng tối ưu / làm chậm
 * - Xác suất đoán mò (IRT Guessing Factor c)
 * - Hệ số K-factor và điểm Elo khởi tạo
 * - Điều kiện dừng sớm thích ứng (Adaptive Early Stopping)
 * - Ngưỡng điểm xếp hạng CEFR
 * - Trọng số hệ thống gợi ý bài học cá nhân hóa (Hybrid Recommender)
 *
 * Tất cả được quy tụ tại file này để Quản trị viên/Giáo viên/Lập trình viên
 * dễ dàng tùy chỉnh mà không cần sửa code lõi của thuật toán.
 */

export const FAME_KT_CONFIG = {
  // 1. Phân tích tâm lý học thời gian (Psychometrics Time Factor)
  TIME_FACTOR: {
    /** Ngưỡng thời gian trả lời siêu nhanh (giây). Dưới ngưỡng này coi là bấm lụi mù quáng/bot */
    ANTI_BOT_THRESHOLD_SEC: 2,
    /** Hệ số phạt khi bấm lụi siêu nhanh */
    ANTI_BOT_FACTOR: 0.2,

    /** Vùng phản xạ tối ưu: Nắm vững kiến thức (Optimal Flow Min - Max giây) */
    OPTIMAL_TIME_MIN_SEC: 2,
    OPTIMAL_TIME_MAX_SEC: 15,
    /** Hệ số thưởng khi làm bài trong vùng phản xạ tối ưu */
    OPTIMAL_FACTOR: 1.5,

    /** Thời gian làm bài thông thường tối đa (giây) */
    NORMAL_MAX_SEC: 20,
    /** Hệ số cho thời gian bình thường */
    NORMAL_FACTOR: 1.0,

    /** Hệ số tối thiểu khi người dùng trả lời quá chậm (tra từ điển / phân vân) */
    SLOW_MIN_FACTOR: 0.3,

    /** Thời gian chuẩn kỳ vọng cho 1 câu hỏi trắc nghiệm (mili-giây) */
    EXPECTED_TIME_MS: 20000,
  },

  // 2. Tham số mô hình IRT (Item Response Theory)
  IRT: {
    /** Xác suất đoán lụi ngẫu nhiên cho trắc nghiệm 4 đáp án A, B, C, D (25% = 0.25) */
    DEFAULT_GUESSING_PROBABILITY: 0.25,
  },

  // 3. Cấu hình hệ thống Elo
  ELO: {
    /** Hệ số K cơ sở dùng để điều chỉnh độ nhạy điểm Elo */
    K_BASE: 32,
    /** Điểm Elo ban đầu cho từng kỹ năng của học viên mới */
    INITIAL_USER_ELO: 1200,
    /** Độ khó Elo mặc định của câu hỏi nếu chưa được gán */
    DEFAULT_QUESTION_ELO: 1200,
  },

  // 4. Cấu hình dừng sớm thích ứng (Computerized Adaptive Testing - Early Stopping)
  EARLY_STOP: {
    /** Số câu tối thiểu học viên phải hoàn thành trước khi hệ thống bắt đầu xét dừng sớm */
    MIN_QUESTIONS: 6,
    /** Số lần cập nhật Elo gần nhất dùng để tính biên độ hội tụ */
    RECENT_QUESTIONS_COUNT: 3,
    /** Biên độ dao động Elo tối đa giữa các câu gần nhất. Nếu dao động < ngưỡng này thì coi là năng lực đã hội tụ */
    VARIANCE_THRESHOLD: 15,
  },

  // 5. Ngưỡng phân cấp trình độ theo khung chuẩn Châu Âu CEFR
  CEFR_THRESHOLDS: {
    A1: 1000,
    A2: 1200,
    B1: 1400,
    B2: 1600,
    C1: 1800,
    C2: 2000,
  },

  // 6. Trọng số thuật toán gợi ý lộ trình cá nhân hóa (Hybrid Recommender)
  RECOMMENDER: {
    /** Điểm cộng cho bài học thuộc kỹ năng yếu nhất của học sinh (để vá lỗ hổng kiến thức) */
    WEAKEST_SKILL_BONUS: 20,
    /** Điểm cộng cho bài học phù hợp với trình độ CEFR hiện tại */
    CEFR_MATCH_BONUS: 15,
    /** Điểm cộng cho bài học trùng khớp với chủ đề/sở thích mà học sinh đã chọn */
    TOPIC_INTEREST_BONUS: 10,
    /** Điểm cộng cho bài học khớp với từ khóa đồng nghĩa mở rộng từ synonyms.csv */
    SYNONYM_MATCH_BONUS: 5,
    /** Ngưỡng điểm tối thiểu để một khóa học được đưa vào danh sách đề xuất */
    MIN_SCORE_THRESHOLD: 10,
    /** Số lượng khóa học được đề xuất tối đa cho học viên sau khi kết thúc test */
    RECOMMENDED_COURSES_LIMIT: 3,
  },

  // 7. Cấu hình bài kiểm tra đầu vào (Placement Test Settings)
  TEST_SETTINGS: {
    /** Số câu hỏi bốc ngẫu nhiên từ ngân hàng câu hỏi phục vụ bài test đầu vào */
    PLACEMENT_QUESTIONS_COUNT: 15,
    /** Thời gian làm bài giả lập mặc định nếu client không gửi timeTakenMs (mili-giây) */
    DEFAULT_SIMULATED_TIME_MS: 8000,
  },
} as const;
