import { FAME_KT_CONFIG } from '../../config/fame-kt.config.js';

export { FAME_KT_CONFIG };

export const CEFR_THRESHOLDS = FAME_KT_CONFIG.CEFR_THRESHOLDS;

// =========================================================================
// THUẬT TOÁN HOÀN THIỆN (FAME-KT - Fuzzy Adaptive Multi-dimensional Elo)
// Ưu việt hơn Elo, BKT và IRT truyền thống ở các điểm thực tế.
// =========================================================================

/**
 * CẢI TIẾN 1: Hợp nhất IRT và Elo (Xử lý vấn đề Đoán mò - Guessing Factor)
 * Elo truyền thống mặc định user không biết gì thì xác suất đúng là 0%.
 * Thực tế trắc nghiệm 4 đáp án (A,B,C,D) thì xác suất đoán lụi luôn là 25% (0.25).
 * Công thức này đưa tham số c (Guessing = 0.25) của IRT vào Elo.
 */
export function getExpectedScoreIRT(
  userElo: number, 
  questionElo: number, 
  c_guessing: number = FAME_KT_CONFIG.IRT.DEFAULT_GUESSING_PROBABILITY
): number {
  const probKnowledge = 1 / (1 + Math.pow(10, (questionElo - userElo) / 400));
  return c_guessing + (1 - c_guessing) * probKnowledge;
}

/**
 * CẢI TIẾN 2: Penalty Anti-Bot & Phân tích tâm lý học thời gian (Psychometrics)
 * - Trả lời siêu nhanh (< 2s): Chắc chắn là bấm bừa/bot -> Hệ số phạt (0.2).
 * - Trả lời trong Vùng tối ưu (2s - 15s): Thưởng hệ số cao (Nắm vững kiến thức, 1.5).
 * - Trả lời bình thường (15s - 20s): Hệ số chuẩn (1.0).
 * - Trả lời chậm (> 20s): Tra từ điển hoặc phân vân quá lâu -> Hệ số suy giảm (tối thiểu 0.3).
 */
export function calculateTimeFactor(
  timeTakenMs: number, 
  expectedTimeMs: number = FAME_KT_CONFIG.TIME_FACTOR.EXPECTED_TIME_MS
): number {
  const timeTakenSec = timeTakenMs / 1000;
  const { 
    ANTI_BOT_THRESHOLD_SEC, 
    ANTI_BOT_FACTOR, 
    OPTIMAL_TIME_MIN_SEC, 
    OPTIMAL_TIME_MAX_SEC, 
    OPTIMAL_FACTOR, 
    NORMAL_FACTOR, 
    SLOW_MIN_FACTOR 
  } = FAME_KT_CONFIG.TIME_FACTOR;
  
  if (timeTakenSec < ANTI_BOT_THRESHOLD_SEC) return ANTI_BOT_FACTOR; // Bấm lụi mù quáng (Anti-bot)
  if (timeTakenSec >= OPTIMAL_TIME_MIN_SEC && timeTakenSec <= OPTIMAL_TIME_MAX_SEC) return OPTIMAL_FACTOR; // Vùng phản xạ tối ưu
  if (timeTakenSec > OPTIMAL_TIME_MAX_SEC && timeTakenSec <= expectedTimeMs / 1000) return NORMAL_FACTOR; // Bình thường
  
  // Trả lời quá chậm (Tra từ điển hoặc phân vân quá lâu)
  return Math.max(SLOW_MIN_FACTOR, expectedTimeMs / timeTakenMs); 
}

/**
 * Hàm Cập nhật Elo Hoàn chỉnh tích hợp IRT Guessing & Psychometrics Time Factor
 */
export function updateAdvancedElo(
  userElo: number, 
  questionElo: number, 
  isCorrect: boolean, 
  timeTakenMs: number,
  c_guessing: number = FAME_KT_CONFIG.IRT.DEFAULT_GUESSING_PROBABILITY,
  kBaseCustom?: number
) {
  const actualScore = isCorrect ? 1 : 0;
  const expectedScore = getExpectedScoreIRT(userElo, questionElo, c_guessing);
  const timeFactor = calculateTimeFactor(timeTakenMs);
  
    // Tính K-factor thích ứng theo độ chênh lệch năng lực & tổn thất bất đối xứng (Asymmetric Loss)
  let kBase = kBaseCustom || FAME_KT_CONFIG.ELO.K_BASE;
  if (isCorrect) {
    // Thưởng xứng đáng khi giải đúng câu hỏi vượt trình độ hiện tại
    if (questionElo > userElo) {
      kBase += (questionElo - userElo) / 1.5;
    }
  } else {
    // Giảm phạt khi câu hỏi quá khó so với năng lực (vốn xác suất đoán trúng đã thấp)
    if (questionElo > userElo + 150) {
      kBase = Math.max(16, kBase * 0.4);
    }
  }

  const kDynamic = kBase * timeFactor;
  
  // Damped K-factor cho câu hỏi để đảm bảo quán tính thống kê
  const kQuestionBase = (FAME_KT_CONFIG.ELO as any).K_QUESTION_BASE || 6;
  const kQuestionDynamic = kQuestionBase * timeFactor;
  const rawQuestionElo = Math.round(questionElo + kQuestionDynamic * (expectedScore - actualScore));

  // Kẹp biên an toàn (Boundary Clamping) tránh biến thiên cực đoan [600, 2400]
  const minElo = (FAME_KT_CONFIG.ELO as any).MIN_QUESTION_ELO || 600;
  const maxElo = (FAME_KT_CONFIG.ELO as any).MAX_QUESTION_ELO || 2400;
  const clampedQuestionElo = Math.max(minElo, Math.min(maxElo, rawQuestionElo));

  return {
    newUserElo: Math.round(userElo + kDynamic * (actualScore - expectedScore)),
    newQuestionElo: clampedQuestionElo
  };
}

/**
 * CẢI TIẾN 3: Đánh giá Đa chiều (Multi-Dimensional Knowledge Tracing)
 * Tiếng Anh chia thành 4 kỹ năng chuẩn: Ngữ pháp, Từ vựng, Nghe, Đọc.
 */
export type UserProficiency = {
  Grammar: number;
  Vocabulary: number;
  Listening: number;
  Reading: number;
};

// Khởi tạo năng lực mặc định
export function createNewUserProficiency(): UserProficiency {
  const initElo = FAME_KT_CONFIG.ELO.INITIAL_USER_ELO;
  return { Grammar: initElo, Vocabulary: initElo, Listening: initElo, Reading: initElo };
}

// Map sang CEFR chuẩn hóa cho toàn bộ hệ thống
export function getCEFRLevel(elo: number): string {
  if (elo < CEFR_THRESHOLDS.A1) return 'A1';
  if (elo < CEFR_THRESHOLDS.A2) return 'A2';
  if (elo < CEFR_THRESHOLDS.B1) return 'B1';
  if (elo < CEFR_THRESHOLDS.B2) return 'B2';
  if (elo < CEFR_THRESHOLDS.C1) return 'C1';
  return 'C2';
}

/**
 * CẢI TIẾN 5: Hệ thống Gợi ý lai (Tìm điểm yếu + Mở rộng từ đồng nghĩa) (Hybrid Recommender System)
 * Tự động phân tích Điểm yếu nhất (Weakest Link) trong Vector năng lực để gợi ý học bù.
 */
export type Lesson = { 
  id: string; 
  title: string; 
  cefr: string; 
  topic: string; 
  skillCategory?: keyof UserProficiency;
  keywords?: string[];
};

export function recommendPersonalizedPath(
  userProficiency: UserProficiency, 
  userTopics: string[], 
  allLessons: Lesson[],
  expandedKeywords?: Set<string>
) {
  // Tìm kỹ năng đang bị "Thọt" nhất (Điểm thấp nhất)
  let weakestSkill: keyof UserProficiency = 'Grammar';
  let minElo = 9999;
  for (const [skill, elo] of Object.entries(userProficiency)) {
    if (elo < minElo) { 
      minElo = elo; 
      weakestSkill = skill as keyof UserProficiency; 
    }
  }

  const weakestCefr = getCEFRLevel(minElo);
  const normalizedUserTopics = userTopics.map(t => t.trim().toLowerCase());
  const { 
    WEAKEST_SKILL_BONUS, 
    CEFR_MATCH_BONUS, 
    TOPIC_INTEREST_BONUS, 
    SYNONYM_MATCH_BONUS, 
    MIN_SCORE_THRESHOLD 
  } = FAME_KT_CONFIG.RECOMMENDER;

  // Chấm điểm từng bài học / chủ đề trong DB
  const scoredLessons = allLessons.map(lesson => {
    let score = 0;
    const lTitle = (lesson.title || '').toLowerCase();
    const lDesc = (lesson.topic || '').toLowerCase();
    
    // 1. Ưu tiên vá lỗ hổng (Weakest Skill)
    if (lesson.skillCategory && lesson.skillCategory === weakestSkill) {
      score += WEAKEST_SKILL_BONUS;
    }
    
    // 2. Phù hợp Trình độ CEFR
    if (lesson.cefr === weakestCefr) {
      score += CEFR_MATCH_BONUS;
    }
    
    // 3. Phù hợp Sở thích trực tiếp (User Topics)
    if (normalizedUserTopics.some(ut => lTitle.includes(ut) || lDesc.includes(ut))) {
      score += TOPIC_INTEREST_BONUS;
    }

    // 4. Mở rộng từ khóa đồng nghĩa (Synonym Expansion)
    if (expandedKeywords && expandedKeywords.size > 0) {
      for (const kw of expandedKeywords) {
        if (lTitle.includes(kw) || lDesc.includes(kw)) {
          score += SYNONYM_MATCH_BONUS;
          break;
        }
      }
    }
    
    return { ...lesson, score };
  });

  return scoredLessons.filter(l => l.score >= MIN_SCORE_THRESHOLD).sort((a, b) => b.score - a.score);
}

/**
 * CẢI TIẾN 4: TỰ ĐỘNG DỪNG (Early Stopping / CAT Auto-stop)
 * Dừng bài test sớm nếu điểm năng lực (Elo) của user đã ổn định (Hội tụ)
 * Giúp tiết kiệm thời gian, không cần làm hết toàn bộ số câu.
 */
export function checkEarlyStop(
  eloHistory: number[], 
  minQuestions: number = FAME_KT_CONFIG.EARLY_STOP.MIN_QUESTIONS
): boolean {
  if (eloHistory.length < minQuestions) return false;
  
  // Lấy các lần thay đổi Elo gần nhất theo cấu hình
  const recentElos = eloHistory.slice(-FAME_KT_CONFIG.EARLY_STOP.RECENT_QUESTIONS_COUNT);
  const variance = Math.max(...recentElos) - Math.min(...recentElos);
  
  // Nếu thí sinh đang trong đà tăng liên tiếp hoặc giảm liên tiếp, KHÔNG dừng sớm vì chưa hội tụ
  const isStrictlyIncreasing = recentElos.every((val, i, arr) => i === 0 || val > arr[i - 1]);
  const isStrictlyDecreasing = recentElos.every((val, i, arr) => i === 0 || val < arr[i - 1]);
  if ((isStrictlyIncreasing || isStrictlyDecreasing) && variance >= 6) {
    return false;
  }

  // Nếu biên độ dao động Elo trong các câu gần nhất <= ngưỡng hội tụ -> Đã hội tụ
  if (variance <= FAME_KT_CONFIG.EARLY_STOP.VARIANCE_THRESHOLD) return true;
  
  return false;
}
